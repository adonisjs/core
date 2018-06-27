/**
 * @module Core
 */

/**
 * @adonisjs/framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
*/

import _ from 'lodash'
import Debug from 'debug'
import requireAll from 'require-all'

const debug = Debug('adonis:framework')

class Config {
  /**
   * Absolute path from where to load the config files from.
   */
  private _configPath: string

  /**
   * In memory configuration store.
   */
  private _config: object = {}

  /**
   * Constructor.
   *
   * @param  configPath  Absolute path from where to load the config files from
   */
  constructor (configPath: string) {
    this._configPath = configPath
    this.syncWithFileSystem()
  }

  /**
   * Syncs the in-memory config store with the file system.
   * Ideally you should keep your config static and
   * never update the file system on the fly.
   */
  public syncWithFileSystem (): void {
    try {
      this._config = requireAll({
        dirname: this._configPath,
        filter: /(.*)\.(js|ts)$/,
      })
      debug('loaded all config files from %s', this._configPath)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  /**
   * Get value for a given key from the config store. Nested
   * values can be accessed via (dot notation). Values
   * referenced with `self::` are further resolved.
   *
   * @param  key           Key to retrieve
   * @param  defaultValue  Default used when the value is empty
   *
   * @example
   * ```
   * Config.get('database.mysql')
   * ```
   *
   * @example
   * ```
   * // referenced
   * {
   *   prodMysql: 'self::database.mysql'
   * }
   * Config.get('database.prodMysql')
   * ```
   */
  public get (key: string, defaultValue: any): any {
    return _.get(this._config, key, defaultValue)
  }

  /**
   * Merge default values with the resolved values.
   * This is to provide a default set of values
   * when it does not exists. This method uses
   * lodash `mergeWith` method.
   *
   * @param  key            Key to merge
   * @param  defaultValue   Default value if it doesn't exists
   * @param  customizer     Customizing the way it merges the values
   */
  public merge (key: string, defaultValue: any, customizer?: Function): Object {
    const value = this.get(key, {})
    return _.mergeWith(defaultValue, value, customizer)
  }

  /**
   * Update value for a given key inside the config store. If
   * value does not exists it will be created.
   *
   * ## Note
   * This method updates the value in memory and not on the
   * file system.
   *
   * @param  key    Key to set
   * @param  value  Value to set
   */
  public set (key: string, value: any): void {
    _.set(this._config, key, value)
  }
}

export { Config }
