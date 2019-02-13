/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { set, get } from 'lodash'

/**
 * A jar of form fields to store form data by handling
 * array gracefully
 */
export class FormFields {
  private _fields: any = {}

  /**
   * Add a new key/value pair. The keys with array like
   * expressions are handled properly.
   *
   * @example
   * ```
   * formfields.add('username', 'virk')
   *
   * // array
   * formfields.add('username[]', 'virk')
   * formfields.add('username[]', 'nikk')
   *
   * // Indexed keys are orderd properly
   * formfields.add('username[1]', 'virk')
   * formfields.add('username[0]', 'nikk')
   * ```
   */
  public add (key: string, value: any): void {
    let isArray = false

    /**
     * Drop `[]` without indexes, since lodash `_.set` and
     * `_.get` methods needs the index or plain key.
     */
    key = key.replace(/\[]$/, () => {
      isArray = true
      return ''
    })

    /**
     * Check to see if value exists or set it (if missing)
     */
    const existingValue = get(this._fields, key)

    if (!existingValue) {
      set(this._fields, key, isArray ? [value] : value)
      return
    }

    /**
     * Mutate existing value if it's an array
     */
    if (existingValue instanceof Array) {
      existingValue.push(value)
      return
    }

    /**
     * Set new value + existing value
     */
    set(this._fields, key, [existingValue, value])
  }

  /**
   * Returns the copy of form fields
   */
  public get () {
    return this._fields
  }
}
