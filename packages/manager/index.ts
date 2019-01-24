/**
 * @adonisjs/manager
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Manager class implements the Builder pattern to make instance of similar
 * implementations using a fluent API vs importing each class by hand.
 *
 * This module is used extensively in AdonisJs. For example: `Mail`, `Sessions`,
 * `Auth` and so on.
 */
export abstract class Manager<T> {
  /**
   * Drivers cache (if caching is enabled)
   */
  private _driversCache = {}

  /**
   * List of drivers added at runtime
   */
  private _extendedDrivers: { [key: string]: (app) => T } = {}

  /**
   * Whether or not to cache drivers
   */
  protected abstract cacheDrivers: boolean

  /**
   * Getting the default driver name, incase a named driver
   * is not fetched
   */
  protected abstract getDefaultDriver (): string

  constructor (protected app) {
  }

  /**
   * Returns the value saved inside cache, this method will check for
   * `cacheDrivers` attribute before entertaining the cache
   */
  private _getCachedDriver (name): T | null {
    if (this.cacheDrivers && this._driversCache[name]) {
      return this._driversCache[name]
    }

    return null
  }

  /**
   * Saves value to the cache with the driver name. This method will check for
   * `cacheDrivers` attribute before entertaining the cache.
   */
  private _saveDriverToCache (name: string, value: T): void {
    if (this.cacheDrivers) {
      this._driversCache[name] = value
    }
  }

  /**
   * Make the extended driver instance and save it to cache (if enabled)
   */
  private _makeExtendedDriver (name): T {
    const value = this._extendedDrivers[name](this.app)
    this._saveDriverToCache(name, value)

    return value
  }

  /**
   * Make the custom driver instance by checking for function on the
   * parent class.
   *
   * For example: `stmp` as the driver name will look for `createSmtp`
   * method on the parent class.
   */
  private _makeDriver (name: string): T {
    const driverCreatorName = `create${name.replace(/^\w|-\w/g, (g) => g.replace(/^-/, '').toUpperCase())}`

    /**
     * Raise error when the parent class doesn't implement the function
     */
    if (typeof (this[driverCreatorName]) !== 'function') {
      throw new Error(`${name} driver is not supported by ${this.constructor.name}`)
    }

    const value = this[driverCreatorName]()
    this._saveDriverToCache(name, value)

    return value
  }

  /**
   * Returns the instance of a given driver. If `name` is not defined
   * the default driver will be resolved.
   */
  public driver (name?: string): T {
    name = name || this.getDefaultDriver()

    const cached = this._getCachedDriver(name)
    if (cached) {
      return cached
    }

    if (this._extendedDrivers[name]) {
      return this._makeExtendedDriver(name)
    }

    return this._makeDriver(name)
  }

  /**
   * Extend by adding new driver. The compisiton of driver
   * is the responsibility of the callback function
   */
  public extend (name: string, callback: (app) => T) {
    this._extendedDrivers[name] = callback
  }
}
