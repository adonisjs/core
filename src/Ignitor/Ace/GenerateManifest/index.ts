/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { logger } from '@poppinss/cliui'
import { ManifestGenerator } from '@adonisjs/ace'
import { Application } from '@adonisjs/application'

import { ErrorHandler } from '../ErrorHandler'
import { registerTsHook } from '../../../utils'
import { AceRuntimeException } from '../Exceptions'

/**
 * Exposes the API to generate the manifest file
 */
export class GenerateManifest {
	private application = new Application(this.appRoot, 'console')

	/**
	 * Source root always points to the compiled source
	 * code.
	 */
	constructor(private appRoot: string) {}

	/**
	 * Returns manifest object for showing help
	 */
	public static getManifestJSON() {
		return {
			'generate:manifest': {
				commandName: 'generate:manifest',
				description: 'Generate ace commands manifest file. Manifest file speeds up commands lookup',
				args: [],
				flags: [],
				settings: {},
			},
		}
	}

	/**
	 * Generates the manifest file for commands
	 */
	public async handle() {
		try {
			/**
			 * Register ts hook when running typescript code directly
			 */
			if (this.application.rcFile.typescript) {
				registerTsHook(this.application.appRoot)
			}

			const commands = this.application.rcFile.commands

			/**
			 * Generating manifest requires us to import the command files to read their
			 * meta data defined as class static properties. However, at this stage
			 * the application is not booted and hence top level IoC container
			 * imports will break
			 */
			this.application.container.trap((namespace) => {
				if (namespace === 'Adonis/Core/Application') {
					return this.application
				}

				return {
					__esModule: new Proxy(
						{ namespace },
						{
							get(target) {
								throw new AceRuntimeException(
									`Top level import for module "${target.namespace}" is not allowed in commands. Learn more https://preview.adonisjs.com/guides/ace/introduction`
								)
							},
						}
					),
				}
			})

			await new ManifestGenerator(this.appRoot, commands).generate()
			logger.action('create').succeeded('ace-manifest.json file')
		} catch (error) {
			await new ErrorHandler(this.application).handleError(error)
		}
	}
}
