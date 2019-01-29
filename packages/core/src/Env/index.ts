/**
 * @module main
 */

 /**
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { isAbsolute, join } from 'path'
import { readFileSync } from 'fs'
import * as dotenv from 'dotenv'
import { Exception } from '@adonisjs/utils'

import { EnvContract } from '../Contracts/Env'

/**
 * The ENV module enables the use of environment variables by loading different `.env` files.
 * In development and production, the module will look for `.env` file inside the project
 * root and during testing, it will merging the values from `.env.testing` file (if exists).
 *
 * If `.env` file is missing, an hard exception will be raised and to turn off exceptions, you
 * must define `ENV_SILENT` environment variable.
 *
 * ```bash
 * ENV_SILENT=true node server.js
 * ```
 *
 * To load `.env` file from a different location, you must define `ENV_PATH` environment variable.
 *
 * **Note: There is no way to override the `.env.testing` file path.**
 *
 * ```bash
 * ENV_PATH=/var/secrets/.env node server.js
 * ```
 */
export class Env implements EnvContract {
  constructor (private _appRoot: string, private _encoding: 'base64' | 'utf8' = 'utf8') {
    /**
     * Load the path defined inside `ENV_PATH` or fallback to
     * `.env` file.
     */
    const envPath = process.env.ENV_PATH || '.env'

    /**
     * Load the default `.env` file
     */
    const { error } = this._load(envPath, false)

    /**
     * Raise error when exists and ENV_SILENT is not set to true
     */
    if (error && process.env.ENV_SILENT !== 'true') {
      throw error
    }

    /**
     * Load .env.testing file when NODE_ENV is testing
     */
    if (process.env.NODE_ENV === 'testing') {
      this._load('.env.testing', true)
    }
  }

  /**
   * Load the file for the given path and parse it's content as env file. This
   * method will patch `process.env` directly.
   *
   * In case of errors, it will be returned as a property `erorr` on the return
   * type. This is done to keep the interface same as `dotenv` module.
   */
  private _load (filePath: string, overwrite: boolean): { error: Error | null } {
    const absPath = isAbsolute(filePath) ? filePath : join(this._appRoot, filePath)
    let contents = ''

    /**
     * Read file synchronously
     */
    try {
      contents = readFileSync(absPath, this._encoding)
    } catch (error) {
      const exception = error.code === 'ENOENT'
        ? new Exception(`The ${filePath} file is missing`, 500, 'E_MISSING_ENV_FILE')
        : error

      return { error: exception }
    }

    /**
     * Parse file contents as `.env`. There is no need to catch `parse` exceptions. If file
     * content is invalid, we must let the process fail
     */
    const envCollection = dotenv.parse(contents.trim())

    /**
     * Overwrite the process.env variables by looping
     * over the collection
     */
    Object.keys(envCollection).forEach((key) => {
      if (process.env[key] === undefined || overwrite) {
        process.env[key] = envCollection[key]
      }
    })

    return { error: null }
  }

  /**
   * Casts the string value to their native data type
   * counter parts. Only done for `booleans` and
   * `nulls`.
   */
  private _castValue (value: string): string | boolean | null | undefined {
    switch (value) {
      case 'null':
        return null
      case 'true':
      case '1':
        return true
      case 'false':
      case '0':
        return false
      default:
        return value
    }
  }

  /**
   * Get value for a key from the process.env. Since `process.env` object stores all
   * values as strings, this method will cast them to their counterpart datatypes.
   *
   * | Value | Casted value |
   * |------|---------------|
   * | 'true' | true |
   * | '1' | true |
   * | 'false' | false |
   * | '0' | false |
   * | 'null' | null |
   *
   * Everything else is returned as a string.
   *
   * A default value can also be defined which is returned when original value
   * is undefined.
   */
  public get (key: string, defaultValue?: any): string | boolean | null | undefined {
    const value = process.env[key]

    if (value === undefined) {
      return defaultValue
    }

    return this._castValue(value)
  }

  /**
   * The method is similar to it's counter part [[get]] method. However, it will
   * raise exception when the original value is non-existing.
   *
   * `undefined`, `null` and `empty strings` are considered as non-exisitng values.
   *
   * We recommended using this method for **environment variables** that are strongly
   * required to run the application stably.
   */
  public getOrFail (key: string, defaultValue?: any): string | boolean {
    const value = this.get(key, defaultValue)

    if (!value && value !== false) {
      throw new Exception(`Make sure to define environment variable ${key}`, 500, 'E_MISSING_ENV_KEY')
    }

    return value
  }

  /**
   * Update/Set value for a key inside the process.env file.
   */
  public set (key: string, value: string): void {
    process.env[key] = value
  }
}
