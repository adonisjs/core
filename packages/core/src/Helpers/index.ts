/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { HelpersContract } from '../Contracts/Helpers'

/**
 * Helpers class exposes helpful helpers methods to make paths
 * to certain directories inside the application.
 *
 * The directories can be overridden inside `.adonisrc.json` file
 */
export class Helpers implements HelpersContract {
  constructor (private _appRoot: string, public directories) {
  }

  /**
   * Path to application root
   */
  public appRoot (...paths: string[]): string {
    return join(this._appRoot, ...paths)
  }

  /**
   * Path to config directory. `directories.config` value
   * from `.adonisrc.json` file used
   */
  public configPath (...paths: string[]): string {
    return this.appRoot(this.directories.config, ...paths)
  }

  /**
   * Path to public directory. `directories.public` value
   * from `.adonisrc.json` file used
   */
  public publicPath (...paths: string[]): string {
    return this.appRoot(this.directories.public, ...paths)
  }

  /**
   * Path to database directory. `directories.database` value
   * from `.adonisrc.json` file used
   */
  public databasePath (...paths: string[]): string {
    return this.appRoot(this.directories.database, ...paths)
  }

  /**
   * Path to migrations directory. `directories.migrations` value
   * from `.adonisrc.json` file used
   */
  public migrationsPath (...paths: string[]): string {
    return this.appRoot(this.directories.migrations, ...paths)
  }

  /**
   * Path to seeds directory. `directories.seeds` value
   * from `.adonisrc.json` file used
   */
  public seedsPath (...paths: string[]): string {
    return this.appRoot(this.directories.seeds, ...paths)
  }

  /**
   * Path to resources directory. `directories.resources` value
   * from `.adonisrc.json` file used
   */
  public resourcesPath (...paths: string[]): string {
    return this.appRoot(this.directories.resources, ...paths)
  }

  /**
   * Path to views directory. `directories.views` value
   * from `.adonisrc.json` file used
   */
  public viewsPath (...paths: string[]): string {
    return this.appRoot(this.directories.views, ...paths)
  }

  /**
   * Path to tmp directory. `directories.tmp` value
   * from `.adonisrc.json` file used
   */
  public tmpPath (...paths: string[]): string {
    return this.appRoot(this.directories.tmp, ...paths)
  }
}
