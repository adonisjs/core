/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { logger } from '@poppinss/cliui'
import { Exception } from '@poppinss/utils'

export class AceRuntimeException extends Exception {
  public handle(error: AceRuntimeException) {
    logger.error(error.message)
  }
}
