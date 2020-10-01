/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { exists } from 'fs'
import { sticker } from '@poppinss/cliui'
import { Application } from '@adonisjs/application'
import { Kernel, ManifestLoader } from '@adonisjs/ace'

import { ErrorHandler } from '../ErrorHandler'
import { AceRuntimeException } from '../Exceptions'
import { SignalsListener } from '../../SignalsListener'

import {
	CommandContract,
	SerializedCommand,
	CommandConstructorContract,
} from '@adonisjs/ace/build/src/Contracts'

/**
 * Exposes the API to execute app commands registered under
 * the manifest file.
 */
export class App {
	private commandName: string

	/**
	 * A boolean to know if we should force exit the
	 * process or not. Check [afterRun] method to
	 * know when it is toggled to true
	 */
	private forceExit: boolean = false

	/**
	 * Whether or not the app was wired. App is only wired, when
	 * loadApp inside the command setting is true.
	 */
	private wired = false

	/**
	 * Signals listener to listen for exit signals and kill command
	 */
	private signalsListener = new SignalsListener()

	/**
	 * Reference to the application
	 */
	private application = new Application(this.appRoot, 'console')

	/**
	 * Reference to the ace kernel
	 */
	private kernel = new Kernel(this.application)

	/**
	 * Source root always points to the compiled source
	 * code.
	 */
	constructor(private appRoot: string) {}

	/**
	 * Print commands help
	 */
	private printHelp(value?: any, command?: any) {
		if (!value) {
			return
		}

		this.kernel.printHelp(command)
		process.exit(0)
	}

	/**
	 * Print framework version
	 */
	private printVersion(value?: any) {
		if (!value) {
			return
		}

		const appVersion = this.application.version
		const adonisVersion = this.application.adonisVersion

		sticker()
			.add('node ace --version')
			.add(`App version ${appVersion ? appVersion.version : 'NA'}`)
			.add(`Framework version ${adonisVersion ? adonisVersion.version : 'NA'}`)
			.render()

		process.exit(0)
	}

	/**
	 * Invoked before command source will be read from the
	 * disk
	 */
	private async onFind(command: SerializedCommand | null) {
		if (this.wired) {
			return
		}

		if (!command || !command.settings.loadApp) {
			return
		}

		await this.wire()
	}

	/**
	 * Invoked before command is about to run.
	 */
	private async onRun() {
		if (this.wired) {
			await this.application.start()
		}
	}

	/**
	 * Invoked command has been ran
	 */
	private async afterRun(command: CommandContract) {
		const commandConstructor = command.constructor as CommandConstructorContract

		/**
		 * Do not exit when the hook is not executed for the main
		 * command
		 */
		if (this.commandName !== commandConstructor.commandName) {
			return
		}

		/**
		 * Do not exit when the command is meant to stayalive
		 */
		if (commandConstructor.settings?.stayAlive) {
			return
		}

		/**
		 * Exit command
		 */
		this.forceExit = true
	}

	/**
	 * Hooks into kernel lifecycle events to conditionally
	 * load the app.
	 */
	private addKernelHooks() {
		this.kernel.before('find', async (command) => this.onFind(command))
		this.kernel.before('run', async () => this.onRun())
		this.kernel.after('run', (command) => this.afterRun(command))
	}

	/**
	 * Adding flags
	 */
	private addKernelFlags() {
		/**
		 * Showing help including core commands
		 */
		this.kernel.flag('help', async (value, _, command) => this.printHelp(value, command), {
			alias: 'h',
		})

		/**
		 * Showing app and AdonisJs version
		 */
		this.kernel.flag('version', async (value) => this.printVersion(value), { alias: 'v' })
	}

	/**
	 * Boot the application.
	 */
	private async wire() {
		if (this.wired) {
			return
		}

		this.wired = true

		/**
		 * Do not change sequence
		 */
		this.application.setup()
		this.application.registerProviders()
		await this.application.bootProviders()
		this.application.requirePreloads()
	}

	/**
	 * Raises human friendly error when the `ace-manifest` file
	 * missing during `generate:manifest` command.
	 */
	private ensureManifestFile() {
		return new Promise((resolve, reject) => {
			exists(join(this.appRoot, 'ace-manifest.json'), (hasFile) => {
				if (!hasFile) {
					reject(
						new AceRuntimeException(
							`Run "node ace generate:manifest" before running any other ace command`
						)
					)
				} else {
					resolve()
				}
			})
		})
	}

	/**
	 * Handle application command
	 */
	public async handle(argv: string[]) {
		try {
			await this.ensureManifestFile()

			/**
			 * Manifest files to load
			 */
			this.kernel.useManifest(
				new ManifestLoader([
					{
						basePath: this.appRoot,
						manifestAbsPath: join(this.appRoot, 'ace-manifest.json'),
					},
				])
			)

			/**
			 * Define kernel hooks to wire the application (if required)
			 */
			this.addKernelHooks()

			/**
			 * Define global flags
			 */
			this.addKernelFlags()

			/**
			 * Preload manifest in advance. This way we can show the help
			 * when no args are defined
			 */
			await this.kernel.preloadManifest()

			/**
			 * Print help when no arguments have been passed
			 */
			if (!argv.length) {
				this.printHelp()
			}

			/**
			 * Hold reference to the command name. We will use this to decide whether
			 * or not to exit the process forcefully after the command has been
			 * executed
			 */
			this.commandName = argv[0]

			/**
			 * Listen for exit events and shutdown app
			 */
			this.signalsListener.listen(async () => {
				if (this.wired) {
					await this.application.shutdown()
				}
			})

			/**
			 * Handle command
			 */
			await this.kernel.handle(argv)
			if (this.forceExit) {
				process.exit(0)
			}
		} catch (error) {
			await new ErrorHandler(this.application).handleError(error)
			if (this.forceExit) {
				process.exit(1)
			}
		}
	}
}
