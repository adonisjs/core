/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import string from '@poppinss/utils/string'
import { basename, extname, relative } from 'node:path'

import { stubsRoot } from '../../stubs/main.js'
import { args, BaseCommand, flags } from '../../modules/ace/main.js'

/**
 * The make middleware command to create a new middleware
 * class.
 */
export default class MakeMiddleware extends BaseCommand {
  static commandName = 'make:middleware'
  static description = 'Create a new middleware class for HTTP requests'

  @args.string({ description: 'Name of the middleware' })
  declare name: string

  @flags.string({ description: 'The stack in which to register the middleware', alias: 's' })
  declare stack?: 'server' | 'named' | 'router'

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
    const { destination } = await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })

    /**
     * Creative relative path for the middleware file from
     * the "./app/middleware" directory
     */
    const middlewareRelativePath = slash(
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
