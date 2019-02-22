/*
 * @adonisjs/utils
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Handles ESM `default` exports and common js vanilla exports. The `default`
 * exports are only entertained, when `esmEnabled` is set to true.
 */
export function tsRequire (filePath: string, esmEnabled = false) {
  const output = require(filePath)
  return esmEnabled && output && output.default ? output.default : output
}
