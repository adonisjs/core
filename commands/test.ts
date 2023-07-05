/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { TestRunner } from '@adonisjs/assembler'

import type { CommandOptions } from '../types/ace.js'
import { BaseCommand, flags, args } from '../modules/ace/main.js'
import { detectAssetsBundler, importAssembler, importTypeScript } from '../src/internal_helpers.js'

/**
 * Test command is used to run tests with optional file watcher. Under the
 * hood, we run "bin/test.js" file.
 */
export default class Test extends BaseCommand {
  static commandName = 'test'
  static description = 'Run tests along with the file watcher to re-run tests on file change'

  static options: CommandOptions = {
    allowUnknownFlags: true,
    staysAlive: true,
  }

  declare testsRunner: TestRunner

  @args.spread({
    description: 'Mention suite names to run tests for selected suites',
    required: false,
  })
  declare suites?: string[]

  @flags.array({ description: 'Filter tests by the filename' })
  declare files?: string[]

  @flags.array({ description: 'Filter tests by tags' })
  declare tags?: string[]

  @flags.array({ description: 'Filter tests by parent group title' })
  declare groups?: string[]

  @flags.array({ description: 'Filter tests by test title' })
  declare tests?: string[]

  @flags.boolean({ description: 'Watch filesystem and re-run tests on file change' })
  declare watch?: boolean

  @flags.boolean({ description: 'Use polling to detect filesystem changes' })
  declare poll?: boolean

  @flags.boolean({
    description: 'Clear the terminal for new logs after file change',
    showNegatedVariantInHelp: true,
    default: true,
  })
  declare clear?: boolean

  @flags.boolean({
    description: 'Start assets bundler dev server.',
    showNegatedVariantInHelp: true,
    default: true,
  })
  declare assets?: boolean

  @flags.array({
    description: 'Define CLI arguments to pass to the assets bundler',
  })
  declare assetsArgs?: string[]

  /**
   * Log a development dependency is missing
   */
  #logMissingDevelopmentDependency(dependency: string) {
    this.logger.error(
      [
        `Cannot find package "${dependency}"`,
        '',
        `The "${dependency}" package is a development dependency and therefore you should run tests with development dependencies installed.`,
        '',
        'If you are run tests inside a CI, make sure the NODE_ENV is set to "development"',
      ].join('\n')
    )
  }

  /**
   * Runs tests
   */
  async run() {
    const assembler = await importAssembler(this.app)
    if (!assembler) {
      this.#logMissingDevelopmentDependency('@adonisjs/assembler')
      this.exitCode = 1
      return
    }

    const assetsBundler = await detectAssetsBundler(this.app)

    this.testsRunner = new assembler.TestRunner(this.app.appRoot, {
      clearScreen: this.clear === false ? false : true,
      nodeArgs: this.parsed.nodeArgs,
      scriptArgs: this.parsed.unknownFlags
        .map((flag) => {
          const value = this.parsed.flags[flag]

          /**
           * Not mentioning value when value is "true"
           */
          if (value === true) {
            return [`--${flag}`] as string[]
          }

          /**
           * Repeating flag multiple times when value is an array
           */
          if (Array.isArray(value)) {
            return value.map((v) => [`--${flag}`, v]) as string[][]
          }

          return [`--${flag}`, value] as string[]
        })
        .flat(2),
      assets: assetsBundler
        ? {
            serve: this.assets === false ? false : true,
            driver: assetsBundler.name,
            cmd: assetsBundler.devServer.command,
            args: (assetsBundler.devServer.args || []).concat(this.assetsArgs || []),
          }
        : {
            serve: false,
          },
      filters: {
        suites: this.suites,
        files: this.files,
        groups: this.groups,
        tags: this.tags,
        tests: this.tests,
      },
      suites: this.app.rcFile.tests.suites.map((suite) => {
        return {
          name: suite.name,
          files: Array.isArray(suite.files) ? suite.files : [suite.files],
        }
      }),
      metaFiles: this.app.rcFile.metaFiles,
    })

    /**
     * Share command logger with assembler, so that CLI flags like --no-ansi has
     * similar impact for assembler logs as well.
     */
    this.testsRunner.setLogger(this.logger)

    /**
     * Exit command when the test runner is closed
     */
    this.testsRunner.onClose((exitCode) => {
      this.exitCode = exitCode
      this.terminate()
    })

    /**
     * Exit command when the dev server crashes
     */
    this.testsRunner.onError(() => {
      this.exitCode = 1
      this.terminate()
    })

    /**
     * Start the test runner in watch mode
     */
    if (this.watch) {
      const ts = await importTypeScript(this.app)
      if (!ts) {
        this.#logMissingDevelopmentDependency('typescript')
        this.exitCode = 1
        return
      }

      await this.testsRunner.runAndWatch(ts, { poll: this.poll || false })
    } else {
      await this.testsRunner.run()
    }
  }
}
