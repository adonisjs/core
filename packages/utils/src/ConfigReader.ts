/*
 * @adonisjs/utils
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * A simple alternative to `Object.assign`. Instead of merging defaults
 * with the user defined config, you can keep a singleton of this
 * class with defaults and call `get` to read the config value
 * falling back to `defaults` when value is undefined in
 * the user config.
 *
 * ### With Object.assign
 * ```js
 * const config = Object.assign(defaults, userConfig)
 * config.key
 * ```
 *
 * ### With config reader
 * ```js
 * const reader = new ConfigReader(defaults)
 * reader.get(userConfig, key)
 * ```
 */
export class ConfigReader<T> {
  constructor (private _defaults: T) {
  }

  public get<K extends keyof T> (mainConfig: Partial<T>, key: K) {
    return typeof (mainConfig[key]) !== 'undefined' ? mainConfig[key] : this._defaults[key]
  }
}
