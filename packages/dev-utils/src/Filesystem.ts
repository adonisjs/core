/*
 * @adonisjs/dev-utils
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join, extname, isAbsolute } from 'path'
import { tmpdir } from 'os'
import { outputFile, remove, readFile } from 'fs-extra'
import * as clearModule from 'clear-module'

/**
 * Filesystem class exposes a consistent API to create, read and delete
 * files during tests. Apart from the generic CRUD operations, it has
 * support for following.
 *
 * 1. Ensures to clear the Node.js require cache if the created
 *    file is a module.
 * 2. Creating and loading `.env` file populates `process.env` object and this
 *    class will track those variables and removes them upon deletion of
 *    env file.
 *
 * ```
 * const fs = new Filesystem()
 *
 * await fs.add('routes.js', `module.exports = 'routes'`)
 * await fs.remove('routes.js') // clears require cache
 *
 * await fs.addEnv('.env', { PORT: '3333' })
 * await fs.remove('.env') // clears process.env.PORT
 *
 * await fs.cleanup()
 * ```
 */
export class Filesystem {
  private _modules: Set<string> = new Set()
  private _envVars: Map<string, string[]> = new Map()

  constructor (public basePath = join(tmpdir(), `${new Date().getTime()}`)) {
  }

  /**
   * Returns a boolean telling if file extension is part
   * of a Node.js module
   */
  private _isModule (filePath: string): boolean {
    return ['.js', '.ts', '.json'].includes(extname(filePath))
  }

  /**
   * Makes abs path to a given file
   */
  private _makePath (filePath: string): string {
    return isAbsolute(filePath) ? filePath : join(this.basePath, filePath)
  }

  /**
   * Removes ext from the file path
   */
  private _dropExt (filePath: string): string {
    return filePath.replace(/\.\w+$/, '')
  }

  /**
   * Removes the file path from nodejs module cache
   */
  private _removeFromModule (filePath: string): void {
    const absPath = this._makePath(filePath)
    this._modules.delete(absPath)

    /**
     * Clear module raises error if file is not
     * in require cache, we can safely ignore
     * the error
     */
    try {
      clearModule(absPath)
    } catch (error) {}
  }

  /**
   * From env variables from `process.env` for the given file
   */
  private _removeFromEnv (filePath: string): void {
    const absPath = this._makePath(filePath)
    if (!this._envVars.has(absPath)) {
      return
    }

    this._envVars.get(absPath)!.forEach((envVar) => {
      delete process.env[envVar]
    })
  }

  /**
   * Store reference of a given file to clear it from the
   * modules cache at a later stage
   */
  private _addToModule (filePath: string): void {
    if (!this._isModule(filePath)) {
      return
    }

    this._modules.add(this._makePath(filePath))
  }

  /**
   * Track env keys in connection to a `.env` file
   */
  private _addToEnv (filePath: string, keys: string[]): void {
    this._envVars.set(this._makePath(filePath), keys)
  }

  /**
   * Add a new file with given contents
   */
  public async add (filePath: string, contents: string): Promise<void> {
    const absPath = this._makePath(filePath)
    await outputFile(absPath, contents)

    this._addToModule(filePath)
  }

  /**
   * Returns file contents
   */
  public async get (filePath: string): Promise<string> {
    return readFile(this._makePath(filePath), 'utf-8')
  }

  /**
   * Create `.env` file and set it's contents from an object. Also this
   * method will track all the env values, which are deleted from
   * `process.env` upon file deletion.
   */
  public async addEnv (filePath: string = '.env', contents: { [key: string]: any }): Promise<void> {
    const fileContents = Object.keys(contents).map((key) => {
      return `${key}=${contents[key]}`
    }).join('\n')

    await this.add(filePath, fileContents)
    await this._addToEnv(filePath, Object.keys(contents))
  }

  /**
   * Remove file
   */
  public async remove (filePath: string): Promise<void> {
    const absPath = this._makePath(filePath)
    await remove(absPath)

    const withoutExt = this._dropExt(absPath)
    if (this._modules.has(absPath) || this._modules.has(withoutExt)) {
      this._removeFromModule(filePath)
      this._removeFromModule(withoutExt)
      return
    }

    this._removeFromEnv(filePath)
  }

  /**
   * Cleanup all files and modules cache (if any)
   */
  public async cleanup (): Promise<void> {
    await remove(this.basePath)
    this._modules.forEach((mod) => {
      this._removeFromModule(mod)
      this._removeFromModule(this._dropExt(mod))
    })

    this._envVars.forEach((_, envFile) => {
      this._removeFromEnv(envFile)
    })
  }
}
