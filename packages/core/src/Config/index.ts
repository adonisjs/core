/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { requireAll } from '@adonisjs/utils'
import { get, set, mergeWith } from 'lodash'
import { ConfigContract } from '../Contracts/Config'

/**
 * Config module eases the process of using configuration inside your AdonisJs
 * applications.
 *
 * The config files are stored inside a seperate directory, which are loaded and cached
 * on application boot. Later you can access the values using the `dot` syntax.
 *
 * ## Access values
 *
 * 1. **Given the config file is stored as `config/app.js` with following content**
 *
 * ```js
 * module.exports = {
 *  appKey: ''
 * }
 * ```
 *
 * 2. **You access the appKey as follows**
 *
 * ```js
 * Config.get('app.appKey')
 * ```
 *
 * The `get` method doesn't raise runtime exceptions when top level objects are missing.
 *
 * ## Extensions
 * By default files ending with `js` extension are loaded. However, you can define a custom set of extensions as
 * an array.
 *
 * ## Parsing config files
 * Though you can define an array of extensions for the files to loaded. The config provider
 * doesn't parse them in any manner.
 *
 * For example: If your configuration files are in Typescript, then make sure to run the process
 * using `ts-node`.
 */
export class Config implements ConfigContract {
  private _configCache: object = {}

  constructor (private _configPath: string) {
    this.sync()
  }

  /**
   * Sync the in-memory cache with the file system. This method synchronously
   * require files using the `require` method.
   */
  public sync () {
    this._configCache = requireAll(this._configPath, true, true) || {}
  }

  /**
   * Read value from the pre-loaded config. Make use of the `dot notation`
   * syntax to read nested values.
   *
   * The `defaultValue` is returned when original value is `undefined`.
   *
   * @example
   * ```js
   * Config.get('database.mysql')
   * ```
   */
  public get (key: string, defaultValue?: any): any {
    return get(this._configCache, key, defaultValue)
  }

  /**
   * Fetch and merge an object to the existing config. This method is useful
   * when you are fetching an object from the config and want to merge
   * it with some default values.
   *
   * An optional customizer can be passed to customize the merge operation.
   * The function is directly passed to [lodash.mergeWith](https://lodash.com/docs/4.17.10#mergeWith)
   * method.
   *
   * @example
   * ```js
   * // Config inside the file will be merged with the given object
   *
   * Config.merge('database.mysql', {
   *   host: '127.0.0.1',
   *   port: 3306
   * })
   * ```
   */
  public merge (key: string, defaultValues: object, customizer?: Function): any {
    return mergeWith(defaultValues, this.get(key), customizer)
  }

  /**
   * Defaults allows providers to define the default config for their
   * module, which is merged with the user config
   */
  public defaults (key: string, value: any): void {
    const existingValue = this.get(key)
    if (!existingValue) {
      this.set(key, value)
    } else {
      mergeWith(this.get(key), value)
    }
  }

  /**
   * Update in memory value of the pre-loaded config
   *
   * @example
   * ```js
   * Config.set('database.host', '127.0.0.1')
   * ```
   */
  public set (key: string, value: any): void {
    set(this._configCache, key, value)
  }
}
