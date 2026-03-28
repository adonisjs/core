/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@poppinss/utils/string'
import { basename, extname, relative } from 'node:path'

import { stubsRoot } from '../../stubs/main.ts'
import { type CommandOptions } from '../../types/ace.ts'
import stringHelpers from '../../src/helpers/string.ts'
import { args, BaseCommand, flags } from '../../modules/ace/main.ts'

/**
 * The make middleware command to create a new middleware
 * class.
 *
 * @example
 * ```
 * ace make:middleware Auth
 * ace make:middleware Auth --stack=server
 * ace make:middleware Auth --stack=named
 * ace make:middleware Auth --stack=router
 * ```
 */
export default class MakeMiddleware extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:middleware'
  /**
   * The command description
   */
  static description =
    'Create a new middleware class in app/middleware and register it in start/kernel.ts under the chosen stack (server, router, or named)'

  /**
   * Command options configuration
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Name of the middleware
   */
  @args.string({ description: 'Name of the middleware' })
  declare name: string

  /**
   * The stack in which to register the middleware
   */
  @flags.string({ description: 'The stack in which to register the middleware', alias: 's' })
  declare stack?: 'server' | 'named' | 'router'

  /**
   * Read the contents from this file (if the flag exists) and use
   * it as the raw contents
   */
  @flags.string({ description: 'Use the contents of the given file as the generated output' })
  declare contentsFrom: string

  /**
   * Forcefully overwrite existing files
   */
  @flags.boolean({ description: 'Forcefully overwrite existing files', alias: 'f' })
  declare force: boolean

  /**
   * The stub to use for generating the middleware
   */
  protected stubPath: string = 'make/middleware/main.stub'

  async run() {
    const stackChoices = ['server', 'router', 'named']

    /**
     * Prompt to select the stack under which to register
     * the middleware
     */
    if (!this.stack) {
      this.stack = await this.prompt.choice(
        'Under which stack you want to register the middleware?',
        stackChoices
      )
    }

    /**
     * Error out when mentioned stack is invalid
     */
    if (!stackChoices.includes(this.stack)) {
      this.exitCode = 1
      this.logger.error(
        `Invalid middleware stack "${this.stack}". Select from "${stackChoices.join(', ')}"`
      )
      return
    }

    /**
     * Create middleware
     */
    const codemods = await this.createCodemods()
    codemods.overwriteExisting = this.force === true
    const { destination } = await codemods.makeUsingStub(
      stubsRoot,
      this.stubPath,
      {
        flags: this.parsed.flags,
        entity: this.app.generators.createEntity(this.name),
      },
      {
        contentsFromFile: this.contentsFrom,
      }
    )

    /**
     * Creative relative path for the middleware file from
     * the "./app/middleware" directory
     */
    const middlewareRelativePath = stringHelpers.toUnixSlash(
      relative(this.app.middlewarePath(), destination).replace(extname(destination), '')
    )

    /**
     * Take the middleware relative path, remove `_middleware` prefix from it
     * and convert everything to camelcase
     */
    const name = string.camelCase(basename(middlewareRelativePath).replace(/_middleware$/, ''))

    /**
     * Register middleware
     */
    await codemods.registerMiddleware(this.stack, [
      {
        name: name,
        path: `#middleware/${middlewareRelativePath}`,
      },
    ])
  }
}
