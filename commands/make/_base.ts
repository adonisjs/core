/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import { stubsRoot } from '../../stubs/index.js'
import { BaseCommand } from '../../modules/ace/main.js'
import type { CommandOptions } from '../../types/ace.js'

/**
 * Base command for make commands
 */
export default abstract class extends BaseCommand {
  /**
   * Allowing unknown flags to enable custom workflows
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Generates the resource from stub
   */
  protected async generate(stubPath: string, stubState: Record<string, any>) {
    const stub = await this.app.stubs.build(stubPath, { source: stubsRoot })
    const output = await stub.generate(
      Object.assign(
        {
          flags: this.parsed.flags,
        },
        stubState
      )
    )

    const entityFileName = slash(this.app.relativePath(output.destination))
    if (output.status === 'skipped') {
      return this.logger.action(`create ${entityFileName}`).skipped(output.skipReason)
    }

    this.logger.action(`create ${entityFileName}`).succeeded()
  }
}
