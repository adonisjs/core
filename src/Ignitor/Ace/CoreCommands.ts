// /*
//  * @adonisjs/core
//  *
//  * (c) Harminder Virk <virk@adonisjs.com>
//  *
//  * For the full copyright and license information, please view the LICENSE
//  * file that was distributed with this source code.
//  */

// import { join, dirname } from 'path'
// import adonisAce from '@adonisjs/ace'
// import { Application } from '@adonisjs/application'
// import { esmRequire, resolveFrom } from '@poppinss/utils'

// import { isMissingModuleError } from '../../utils'
// import { AceRuntimeException } from './AceRuntimeException'

// /**
//  * Exposes the API to run core commands from `@adonisjs/assembler`.
//  */
// export class CoreCommands {
// 	/**
// 	 * List of core commands
// 	 */
// 	public static commandsList = Object.keys(CoreCommands.getManifestJSON())

// 	/**
// 	 * A local list of assembler commands. We need this, so that when assembler
// 	 * is not installed (probably in production) and someone is trying to
// 	 * build the project by running `serve` or `build`, we should give
// 	 * them a better descriptive error.
// 	 *
// 	 * Also, do note that at times this list will be stale, but we get it back
// 	 * in sync over time.
// 	 */
// 	public static localCommandsList = [
// 		'build',
// 		'serve',
// 		'invoke',
// 		'make:command',
// 		'make:controller',
// 		'make:middleware',
// 		'make:provider',
// 		'make:validator',
// 		'make:view',
// 		'make:prldfile',
// 	]

// 	/**
// 	 * Returns assembler manifest file for showing help
// 	 */
// 	public static getManifestJSON() {
// 		try {
// 			return require('@adonisjs/assembler/build/ace-manifest.json')
// 		} catch (error) {
// 			return {}
// 		}
// 	}

// 	private application = new Application(this.appRoot, 'console')

// 	constructor(private appRoot: string) {}

// 	/**
// 	 * Lazy load @adonisjs/assembler
// 	 */
// 	private async importAssembler(command: string) {
// 		try {
// 			return await import('@adonisjs/assembler/build/src/EnvParser/index')
// 		} catch (error) {
// 			if (isMissingModuleError(error)) {
// 				throw new AceRuntimeException(
// 					`Install "@adonisjs/assembler" to execute "${command}" command`
// 				)
// 			}

// 			throw error
// 		}
// 	}

// 	/**
// 	 * Handle core commands
// 	 */
// 	public async handle(argv: string[]) {
// 		this.setupApplication()
// 		await this.importAssembler(argv[0])

// 		const manifest = new this.ace.Manifest(
// 			dirname(resolveFrom(this.appRoot, '@adonisjs/assembler'))
// 		)
// 		const kernel = new this.ace.Kernel(this.application)

// 		/**
// 		 * Showing commands help
// 		 */
// 		kernel.flag(
// 			'help',
// 			async (value, _, command) => {
// 				if (!value) {
// 					return
// 				}

// 				kernel.printHelp(command)
// 				process.exit(0)
// 			},
// 			{ alias: 'h' }
// 		)

// 		kernel.useManifest(manifest)
// 		await kernel.handle(argv)
// 	}
// }
