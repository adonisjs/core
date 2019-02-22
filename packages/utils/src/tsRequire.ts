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
export function tsRequire (filePath: string) {
  const output = require(filePath)
  return output && output.__esModule && output.default ? output.default : output
}
