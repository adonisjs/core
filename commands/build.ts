/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand, flags } from '../modules/ace/main.js'

/**
 * Serve command is used to run the AdonisJS HTTP server during development. The
 * command under the hood runs the "bin/server.ts" file and watches for file
 * system changes
 */
export default class Build extends BaseCommand {
  static commandName = 'build'
  static description =
    'Build application for production by compiling frontend assets and TypeScript source to JavaScript'

  @flags.boolean({ description: 'Watch filesystem and restart the HTTP server on file change' })
  declare watch?: boolean

  @flags.boolean({ description: 'Ignore TypeScript errors and continue with the build process' })
  declare ignoreTsErrors?: boolean

  @flags.string({
    description: 'Select the package manager you want to use to install production dependencies',
  })
  declare packageManager?: 'npm' | 'pnpm' | 'yarn'

  /**
   * Imports assembler and displays a human readable debugging message
   */
  async #importAssembler(): Promise<typeof import('@adonisjs/assembler') | undefined> {
    try {
      return await this.app.import('@adonisjs/assembler')
    } catch {
      this.logger.error(
        [
          'Unable to import "@adonisjs/assembler"',
          '',
          'The "@adonisjs/assembler" package is a development dependency and therefore you should use the build command during development only.',
          '',
          'If you are using the build command inside a CI or with a deployment platform, make sure the NODE_ENV is set to "development"',
        ].join('\n')
      )
      this.exitCode = 1
    }
  }

  /**
   * Imports typescript and displays a human readable debugging message
   */
  async #importTypeScript() {
    try {
      return await this.app.import('typescript')
    } catch {
      this.logger.error(
        [
          'Unable to import "typescript"',
          '',
          'The "typescript" package is a development dependency and therefore you should use the build command during development only.',
          '',
          'If you are using the build command inside a CI or with a deployment platform, make sure the NODE_ENV is set to "development"',
        ].join('\n')
      )
      this.exitCode = 1
    }
  }

  /**
   * Build application
   */
  async run() {
    const assembler = await this.#importAssembler()
    const ts = await this.#importTypeScript()
    if (!assembler || !ts) {
      return
    }

    const bundler = new assembler.Bundler(this.app.appRoot, ts.default, {})

    /**
     * Share command logger with assembler, so that CLI flags like --no-ansi has
     * similar impact for assembler logs as well.
     */
    bundler.setLogger(this.logger)

    /**
     * Bundle project for production
     */
    const stopOnError = this.ignoreTsErrors === true ? false : true
    const builtSuccessfully = await bundler.bundle(stopOnError, this.packageManager)
    if (!builtSuccessfully) {
      this.exitCode = 1
    }
  }
}
