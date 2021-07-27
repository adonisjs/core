/*
 * @slynova/flydrive
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@poppinss/utils'

export class CannotGenerateUrlException extends Exception {
  public static invoke(location: string, diskName: string) {
    return new this(
      `Cannot generate URL for file "${location}". Make sure to set "serveAssets = true" for "${diskName}" disk`,
      500,
      'E_CANNOT_GENERATE_DRIVE_URL'
    )
  }
}
