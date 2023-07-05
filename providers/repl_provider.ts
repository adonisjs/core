/*
 * @adonisjs/repl
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { ApplicationService } from '@adonisjs/core/types'

import { importTsNode } from '../src/internal_helpers.js'
import { defineReplBindings } from '../src/repl_bindings.js'

export default class ReplProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Create the typescript compiler to be used for compiling
   * the user code inside the REPL
   */
  async #createCompiler() {
    const tsNode = await importTsNode(this.app)
    if (!tsNode) {
      return
    }

    const tsConfigPath = new URL('./tsconfig.json', this.app.appRoot)
    const compiler = tsNode.create({
      project: fileURLToPath(tsConfigPath),
      compilerOptions: { module: 'ESNext' },
    })

    return {
      supportsTypescript: true,
      compile(code: string, fileName: string) {
        return compiler.compile(code, fileName)
      },
    }
  }

  /**
   * Register the Repl as a singleton
   */
  registerRepl() {
    this.app.container.singleton('repl', async () => {
      const { Repl } = await import('../modules/repl.js')

      const repl = new Repl({
        compiler: await this.#createCompiler(),
        historyFilePath: join(homedir(), '.adonis_repl_history'),
      })

      defineReplBindings(this.app, repl)

      return repl
    })
  }

  /**
   * Register bindings
   */
  register() {
    if (this.app.getEnvironment() !== 'repl') {
      return
    }

    this.registerRepl()
  }
}
