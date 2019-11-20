/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { join } from 'path'

import { AppCommands } from './AppCommands'
import { CoreCommands } from './CoreCommands'
import { isMissingModuleError } from '../../utils'
import { GenerateManifest } from './GenerateManifest'
import { RuntimeException } from './RuntimeException'

const RC_FILE_NAME = '.adonisrc.json'
const TS_CONFIG_FILE = 'tsconfig.json'

/**
 * Exposes the API to execute ace commands.
 */
export class Ace {
  constructor (private _appRoot: string) {
    /**
     * This environment variable helps runtime to find the actual
     * source directory
     */
    process.env.ADONIS_CLI_CWD = this._appRoot
  }

  /**
   * Lazy load ace
   */
  private async _importAce () {
    try {
      return await import('@adonisjs/ace')
    } catch (error) {
      if (isMissingModuleError(error)) {
        throw new RuntimeException('Install "@adonisjs/ace" to execute ace commands')
      }

      throw error
    }
  }

  /**
   * Returns a boolean telling if project root has typescript
   * source code. This is done by inspecting `.adonisrc.json`
   * file.
   */
  private _isTsProject () {
    try {
      const rcFile = require(join(this._appRoot, RC_FILE_NAME)) || {}
      return rcFile.typescript === false ? false : true
    } catch (error) {
      if (isMissingModuleError(error)) {
        throw new RuntimeException(
          `Error: Before running ace commands, ensure that project root has "${RC_FILE_NAME}" file`,
        )
      }

      throw error
    }
  }

  /**
   * Returns the build directory relative path. Call this when you are
   * sure that it is a valid typescript project
   */
  private _getBuildDir () {
    try {
      const tsConfig = require(join(this._appRoot, TS_CONFIG_FILE)) || {}
      if (!tsConfig.compilerOptions || !tsConfig.compilerOptions.outDir) {
        throw new RuntimeException(
          `Make sure to define "compilerOptions.outDir" in ${TS_CONFIG_FILE} file`,
        )
      }

      return tsConfig.compilerOptions.outDir
    } catch (error) {
      if (isMissingModuleError(error)) {
        throw new RuntimeException(
          `Typescript projects must have "${TS_CONFIG_FILE}" file inside the project root`,
        )
      }

      throw error
    }
  }

  /**
   * Handles the ace command
   */
  public async handle (argv: string[]) {
    const ace = await this._importAce()

    try {
      const buildDir = join(this._appRoot, this._isTsProject() ? this._getBuildDir() : './')

      /**
       * Handle generate manifest manually
       */
      if (argv[0] === 'generate:manifest') {
        await new GenerateManifest(buildDir, ace).handle()
        return
      }

      /**
       * Pass command over to core commands from `assembler`
       */
      if (CoreCommands.commandsList.includes(argv[0])) {
        console.log('will handle it')
        return
      }

      /**
       * Proxy over to application commands
       */
      await new AppCommands(buildDir, ace!).handle(argv)
    } catch (error) {
      ace.handleError(error, (_error, logger) => {
        if (error instanceof RuntimeException) {
          logger.error(error.message)
        } else {
          logger.fatal(error)
        }
      })
    }
  }
}
