/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stubsRoot } from '../../stubs/main.js'
import { args, flags, BaseCommand } from '../../modules/ace/main.js'

/**
 * Make a new test file
 */
export default class MakeTest extends BaseCommand {
  static commandName = 'make:test'
  static description = 'Create a new Japa test file'

  @args.string({ description: 'Name of the test file' })
  declare name: string

  @flags.string({ description: 'The suite for which to create the test file', alias: 's' })
  declare suite?: string

  /**
   * The stub to use for generating the test file
   */
  protected stubPath: string = 'make/test/main.stub'

  /**
   * Returns the suite name for creating the test file
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
   * Returns the directory path for the selected suite.
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
   * Find suite info from the rcFile file
   */
  #findSuite(suiteName: string) {
    return this.app.rcFile.tests.suites.find((suite) => {
      return suite.name === suiteName
    })
  }

  /**
   * Executed by ace
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
    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
      suite: {
        directory: await this.#getSuiteDirectory(suite.directories),
      },
    })
  }
}
