/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stubsRoot } from '../../stubs/main.ts'
import { args, flags, BaseCommand } from '../../modules/ace/main.ts'

/**
 * Command to create a new Japa test file.
 * Supports multiple test suites and automatically detects or prompts for
 * the appropriate suite and directory based on application configuration.
 *
 * @example
 * ```
 * ace make:test UserController
 * ace make:test UserModel --suite=unit
 * ace make:test AuthService --suite=integration
 * ```
 */
export default class MakeTest extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:test'

  /**
   * The command description
   */
  static description = 'Create a new Japa test file'

  /**
   * Name of the test file to create
   */
  @args.string({ description: 'Name of the test file' })
  declare name: string

  /**
   * Test suite name where the test file should be created
   */
  @flags.string({ description: 'The suite for which to create the test file', alias: 's' })
  declare suite?: string

  /**
   * Read the contents from this file (if the flag exists) and use
   * it as the raw contents
   */
  @flags.string({ description: 'Use the contents of the given file as the generated output' })
  declare contentsFrom: string

  /**
   * The stub template file to use for generating the test file
   */
  protected stubPath: string = 'make/test/main.stub'

  /**
   * Determine the test suite name for creating the test file.
   * Uses the provided suite flag, or automatically selects if only one suite exists,
   * or prompts the user to choose from available suites.
   *
   * @returns The name of the selected test suite
   */
  async #getSuite(): Promise<string> {
    if (this.suite) {
      return this.suite
    }

    /**
     * Use the first suite from the rcFile when there is only
     * one suite
     */
    const rcFileSuites = this.app.rcFile.tests.suites
    if (rcFileSuites.length === 1) {
      return rcFileSuites[0].name
    }

    /**
     * Prompt the user to select a suite manually
     */
    return this.prompt.choice(
      'Select the suite for the test file',
      this.app.rcFile.tests.suites.map((suite) => {
        return suite.name
      }),
      {
        validate(choice) {
          return choice ? true : 'Please select a suite'
        },
      }
    )
  }

  /**
   * Determine the directory path for the test file within the selected suite.
   * Automatically selects if only one directory exists, otherwise prompts the user.
   *
   * @param directories - Array of available directories for the suite
   * @returns The selected directory path
   */
  async #getSuiteDirectory(directories: string[]): Promise<string> {
    if (directories.length === 1) {
      return directories[0]
    }

    return this.prompt.choice('Select directory for the test file', directories, {
      validate(choice) {
        return choice ? true : 'Please select a directory'
      },
    })
  }

  /**
   * Find suite configuration from the RC file by name.
   *
   * @param suiteName - The name of the suite to find
   * @returns The suite configuration or undefined if not found
   */
  #findSuite(suiteName: string) {
    return this.app.rcFile.tests.suites.find((suite) => {
      return suite.name === suiteName
    })
  }

  /**
   * Execute the command to create a new test file.
   * Validates the suite exists, prompts for missing information,
   * and generates the test file in the appropriate location.
   */
  async run() {
    const suite = this.#findSuite(await this.#getSuite())

    /**
     * Show error when mentioned/selected suite does not exist
     */
    if (!suite) {
      this.logger.error(`The "${this.suite}" suite is not configured inside the "adonisrc.js" file`)
      this.exitCode = 1
      return
    }

    /**
     * Generate entity
     */
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(
      stubsRoot,
      this.stubPath,
      {
        flags: this.parsed.flags,
        entity: this.app.generators.createEntity(this.name),
        suite: {
          directory: await this.#getSuiteDirectory(suite.directories),
        },
      },
      {
        contentsFromFile: this.contentsFrom,
      }
    )
  }
}
