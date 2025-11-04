/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { TestRunner } from '@adonisjs/assembler'

import { importAssembler } from '../src/utils.ts'
import type { CommandOptions } from '../types/ace.ts'
import { BaseCommand, flags, args } from '../modules/ace/main.ts'

/**
 * Command to run application tests using the Japa test runner.
 * Supports filtering tests by suites, files, tags, groups, and individual tests.
 * Can run in watch mode to automatically re-run tests when files change.
 *
 * @example
 * ```
 * ace test
 * ace test unit integration
 * ace test --watch
 * ace test --files=user.spec.ts
 * ace test --tags=slow --groups="User tests"
 * ace test --reporters=spec,dot
 * ace test --timeout=5000 --retries=2
 * ```
 */
export default class Test extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'test'

  /**
   * The command description
   */
  static description = 'Run tests along with the file watcher to re-run tests on file change'

  /**
   * Command options configuration.
   * Allows unknown flags to be passed to Japa and keeps the process alive.
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
    staysAlive: true,
  }

  /**
   * The test runner instance from the assembler package
   */
  declare testsRunner: TestRunner

  /**
   * Test suite names to run. When provided, only tests from the specified suites will be executed
   */
  @args.spread({
    description: 'Mention suite names to run tests for selected suites',
    required: false,
  })
  declare suites?: string[]

  /**
   * Filter tests by filename patterns
   */
  @flags.array({ description: 'Filter tests by the filename' })
  declare files?: string[]

  /**
   * Filter tests by tags
   */
  @flags.array({ description: 'Filter tests by tags' })
  declare tags?: string[]

  /**
   * Filter tests by parent group title
   */
  @flags.array({ description: 'Filter tests by parent group title' })
  declare groups?: string[]

  /**
   * Filter tests by test title
   */
  @flags.array({ description: 'Filter tests by test title' })
  declare tests?: string[]

  /**
   * Specify one or more test reporters to use for output formatting
   */
  @flags.array({ description: 'Activate one or more test reporters' })
  declare reporters?: string[]

  /**
   * Enable watch mode to automatically re-run tests when files change
   */
  @flags.boolean({ description: 'Watch filesystem and re-run tests on file change' })
  declare watch?: boolean

  /**
   * Use polling instead of native filesystem events to detect file changes
   */
  @flags.boolean({ description: 'Use polling to detect filesystem changes' })
  declare poll?: boolean

  /**
   * Default timeout in milliseconds for all tests
   */
  @flags.number({ description: 'Define default timeout for all tests' })
  declare timeout?: number

  /**
   * Default number of retries for failed tests
   */
  @flags.number({ description: 'Define default retries for all tests' })
  declare retries?: number

  /**
   * Execute only tests that failed during the last run
   */
  @flags.boolean({ description: 'Execute tests failed during the last run' })
  declare failed?: boolean

  /**
   * Clear the terminal for new logs after file change in watch mode
   */
  @flags.boolean({
    description: 'Clear the terminal for new logs after file change',
    showNegatedVariantInHelp: true,
    default: true,
  })
  declare clear?: boolean

  /**
   * Log an error message when a required development dependency is missing.
   * Provides helpful instructions for resolving the issue.
   *
   * @param dependency - The name of the missing dependency package
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
   * Collect unknown flags and format them to pass to the Japa test runner.
   * Handles boolean flags, arrays, and single values appropriately.
   *
   * @returns Array of formatted command-line arguments for Japa
   */
  #getPassthroughFlags(): string[] {
    return this.parsed.unknownFlags
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
      .flat(2)
  }

  /**
   * Execute the test command. Sets up the test runner with all configured options
   * and filters, then runs tests either once or in watch mode. Handles missing
   * dependencies and properly configures the test environment.
   */
  async run() {
    process.env.NODE_ENV = 'test'

    const assembler = await importAssembler(this.app)
    if (!assembler) {
      this.#logMissingDevelopmentDependency('@adonisjs/assembler')
      this.exitCode = 1
      return
    }

    this.testsRunner = new assembler.TestRunner(this.app.appRoot, {
      clearScreen: this.clear === false ? false : true,
      nodeArgs: this.parsed.nodeArgs,
      scriptArgs: this.#getPassthroughFlags(),
      filters: {
        suites: this.suites,
        files: this.files,
        groups: this.groups,
        tags: this.tags,
        tests: this.tests,
      },
      failed: this.failed,
      retries: this.retries,
      timeout: this.timeout,
      reporters: this.reporters,
      suites: this.app.rcFile.tests.suites.map((suite) => {
        return {
          name: suite.name,
          files: suite.files,
        }
      }),
      env: {
        NODE_ENV: 'test',
      },
      hooks: this.app.rcFile.hooks,
      metaFiles: this.app.rcFile.metaFiles,
    })

    /**
     * Share command logger with assembler, so that CLI flags like --no-ansi has
     * similar impact for assembler logs as well.
     */
    this.testsRunner.ui.logger = this.logger

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
      await this.testsRunner.runAndWatch({ poll: this.poll || false })
    } else {
      await this.testsRunner.run()
    }
  }
}
