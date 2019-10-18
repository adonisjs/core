/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { esmRequire } from '@poppinss/utils'

export function optionalRequire (filePath: string, optional = false): any | null {
  try {
    return esmRequire(filePath)
  } catch (error) {
    if (['MODULE_NOT_FOUND', 'ENOENT'].indexOf(error.code) > -1 && optional) {
      return null
    }

    throw error
  }
}
