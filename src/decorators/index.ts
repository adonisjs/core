/**
 * @module main
 */

 /*
* @adonisjs/fold
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/**
 * Injects bindings to the class constructor
 */
export function inject (value: string | string[]) {
  return function decorator (constructor) {
    constructor.inject = constructor.inject || []
    constructor.inject = constructor.inject.concat(value)
  }
}
