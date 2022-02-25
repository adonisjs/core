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

import { AppKernel } from '../../Kernel'
import { AceRuntimeException } from '../Exceptions'

/**
 * Exposes the API to generate the manifest file
 */
export class GenerateManifest {
  private kernel = new AppKernel(this.appRoot, 'console')

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
      commandName: 'generate:manifest',
      description: 'Generate ace commands manifest file. Manifest file speeds up commands lookup',
      args: [],
      flags: [],
      settings: {},
      aliases: [],
      commandPath: '',
    }
  }

  /**
   * Generates the manifest file for commands
   */
  public async handle() {
    try {
      this.kernel.registerTsCompilerHook()

      const commands = this.kernel.application.rcFile.commands

      /**
       * Generating manifest requires us to import the command files to read their
       * meta data defined as class static properties. However, at this stage
       * the application is not booted and hence top level IoC container
       * imports will break
       */
      this.kernel.application.container.trap((namespace) => {
        if (namespace === 'Adonis/Core/Application') {
          return this.kernel.application
        }

        return {
          __esModule: new Proxy(
            { namespace },
            {
              get(target) {
                throw new AceRuntimeException(
                  `Top level import for module "${target.namespace}" is not allowed in commands. Learn more https://docs.adonisjs.com/guides/ace-commandline#top-level-imports-are-not-allowed`
                )
              },
            }
          ),
        }
      })

      await new ManifestGenerator(this.appRoot, commands).generate()
      logger.action('create').succeeded('ace-manifest.json file')
    } catch (error) {
      await this.kernel.handleError(error).finally(() => process.exit(1))
    }
  }
}
