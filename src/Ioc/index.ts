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

import { normalize, resolve, dirname } from 'path'

import { IIoC, IBindCallback, IBinding, IAutoloadCacheItem } from '../Contracts'
import { IoCProxyObject, IocProxyClass } from './IoCProxy'
import tracer from './Tracer'

const toString = Function.prototype.toString

/**
 * Ioc container to manage and compose dependencies of your application
 * with ease.
 *
 * The container follows and encourages the use of dependency injection
 * in your application and provides all the neccessary tools to make
 * DI simpler.
 */
export class Ioc implements IIoC {
  public tracer = tracer(this._emitEvents)

  /**
   * Autoloaded directories under a namespace
   */
  private _autoloads: { [namespace: string]: string } = {}

  /**
   * An array of autoloaded aliases, stored along side with
   * `_autoloads` for a quick lookup on keys
   */
  private _autoloadedAliases: string[] = []

  /**
   * Autoloaded cache to improve the `require` speed, which is
   * dog slow.
   */
  private _autoloadsCache: Map<string, IAutoloadCacheItem> = new Map()

  /**
   * Copy of aliases
   */
  private _aliases: { [alias: string]: string } = {}

  /**
   * Copy of actual bindings
   */
  private _bindings: { [namespace: string]: IBinding } = {}

  /**
   * Copy of fakes as a Map, since fakes are subjective to
   * mutations
   */
  private _fakes: Map<string, IBinding> = new Map()

  /**
   * Using proxies or not? Fakes only works when below one
   * is set to true.
   */
  private _useProxies = process.env.ADONIS_IOC_PROXY === 'true'

  constructor (private _emitEvents = false, public es6Imports = false) {
  }

  /**
   * Returns the binding return value. This method must be called when
   * [[hasBinding]] returns true.
   */
  private _resolveBinding (name: string) {
    const binding = this._bindings[name]
    this.tracer.in(name, !!binding.cachedValue)

    /**
     * Cache the value if is a singleton and their is no cached value
     */
    if (binding.singleton && !binding.cachedValue) {
      binding.cachedValue = binding.callback(this)
    }

    /**
     * Return the cached value for singletons
     */
    if (binding.singleton) {
      this.tracer.out()
      return binding.cachedValue
    }

    const value = binding.callback(this)
    this.tracer.out()
    return value
  }

  /**
   * Makes the require path from the autoloaded alias. This path then is given to
   * Node.js `require` function.
   */
  private _makeRequirePath (baseNamespace: string, namespace: string): string {
    const diskPath = namespace.replace(baseNamespace, this._autoloads[baseNamespace])
    return require.resolve(normalize(diskPath))
  }

  /**
   * Load a file from the disk using Node.js require method. The output of
   * require is further cached to improve peformance.
   *
   * Make sure to call this method when [[isAutoloadNamespace]] returns true.
   */
  private _autoload (namespace: string) {
    const baseNamespace = this.getAutoloadBaseNamespace(namespace)!

    const cacheEntry = this._autoloadsCache.get(namespace)
    this.tracer.in(namespace, !!cacheEntry)

    /**
     * Require the module and cache it
     */
    if (!cacheEntry) {
      const absPath = this._makeRequirePath(baseNamespace, namespace)
      const importValue = require(absPath)

      /**
       * Use `default` when parent app uses `ES6 imports` and
       * default export exists on the return value
       */
      const value = importValue.default && this.es6Imports
        ? importValue.default
        : importValue

      this._autoloadsCache.set(namespace, {
        diskPath: absPath,
        cachedValue: value,
      })
    }

    this.tracer.out()
    return this._autoloadsCache.get(namespace)!.cachedValue
  }

  /**
   * Make instance of a class by auto-injecting it's defined
   * dependencies.
   */
  private _makeInstanceOf (value, relativeFrom) {
    if (!this._isClass(value) || value.makePlain === true) {
      return value
    }

    const injections = (value.inject || []).map((injection) => this.make(injection, relativeFrom))
    return new value(...injections)
  }

  /**
   * Require the module using Node.js `require` function.
   */
  private _requireModule (modulePath: string, relativeFrom?: string) {
    if (modulePath.startsWith('./') || modulePath.startsWith('/')) {
      relativeFrom = relativeFrom || module.parent!.filename
      return require(resolve(dirname(relativeFrom), modulePath))
    }

    return require(modulePath)
  }

  /**
   * Resolve the value for a namespace by trying all possible
   * combinations of `bindings`, `aliases`, `autoloading`
   * and finally falling back to `nodejs require`.
   */
  private _resolve (name: string, relativeFrom?: string) {
    if (this.hasBinding(name)) {
      return this._resolveBinding(name)
    }

    if (this.hasAlias(name)) {
      return this._resolve(this.getAliasNamespace(name)!)
    }

    if (this.isAutoloadNamespace(name)) {
      return this._autoload(name)
    }

    return this._requireModule(name, relativeFrom)
  }

  /**
   * Resolve the value for a namespace by trying all possible
   * combinations of `bindings`, `aliases`, `autoloading`
   * and finally falling back to `nodejs require` and then
   * make an instance of it and it's dependencies.
   */
  private _resolveAndMake (name: string, relativeFrom?: string) {
    if (typeof (name) !== 'string') {
      return this._makeInstanceOf(name, relativeFrom)
    }

    if (this.hasBinding(name)) {
      return this._resolveBinding(name)
    }

    if (this.hasAlias(name)) {
      return this._resolve(this.getAliasNamespace(name)!)
    }

    if (this.isAutoloadNamespace(name)) {
      return this._makeInstanceOf(this._autoload(name), relativeFrom)
    }

    return this._requireModule(name, relativeFrom)
  }

  /**
   * Clear the module entry from the require cache. The `modulePath`
   * must be an absolute path.
   */
  private _clearRequireCache (modulePath: string) {
    const cacheItem = require.cache[modulePath]
    /* istanbul ignore if */
    if (!cacheItem) {
      return
    }

    /**
     * Just remove the module, when there is no
     * parent
     */
    delete require.cache[modulePath]

    /* istanbul ignore if */
    if (!cacheItem.parent) {
      return
    }

    let i = cacheItem.parent.children.length

    /**
     * Remove reference from the parent
     */
    while (i--) {
      if (cacheItem.parent.children[i].id === modulePath) {
        cacheItem.parent.children.splice(i, 1)
      }
    }
  }

  /**
   * Removes an autoload namespace from the cache. If the value doesn't
   * exists in the cache, then this method will be a noop.
   */
  private _removeAutoloadFromCache (namespace: string, clearRequireCache: boolean) {
    const item = this._autoloadsCache.get(namespace)
    if (!item) {
      return
    }

    /**
     * Remove it from the object
     */
    this._autoloadsCache.delete(namespace)

    /**
     * Clear the require cache if instructed for same
     */
    /* istanbul ignore else */
    if (clearRequireCache) {
      this._clearRequireCache(item.diskPath)
    }
  }

  /**
   * Returns a boolean to differentiate between classes and plain
   * functions
   */
  private _isClass (fn) {
    return typeof (fn) === 'function' && /^class\s/.test(toString.call(fn))
  }

  /**
   * Returns a boolean to differentiate between null and objects
   * and arrays too
   */
  private _isObject (value): boolean {
    return value && typeof (value) === 'object' && !Array.isArray(value)
  }

  /**
   * Add a new binding with a namespace. Keeping the namespace unique
   * is the responsibility of the user. We do not restrict duplicate
   * namespaces, since it's perfectly acceptable to provide new
   * values for existing bindings.
   *
   * @example
   * ```js
   * ioc.bind('App/User', function () {
   *  return new User()
   * })
   * ```
   */
  public bind (namespace: string, callback: IBindCallback): void {
    this.tracer.emit('bind', { namespace, singleton: false })
    this._bindings[namespace] = { callback, singleton: false }
  }

  /**
   * Add a new binding as a singleton. This method behaves similar to
   * [[bind]], just the value is cached after the first use. The
   * `callback` will be invoked only once.
   *
   * @example
   * ```js
   * ioc.singleton('App/User', function () {
   *  return new User()
   * })
   * ```
   */
  public singleton (namespace: string, callback: IBindCallback): void {
    this.tracer.emit('bind', { namespace, singleton: true })
    this._bindings[namespace] = { callback, singleton: true }
  }

  /**
   * Define alias for an existing binding. IoC container doesn't handle uniqueness
   * conflicts for you and it's upto you to make sure that all aliases are
   * unique.
   *
   * Use method [[hasAlias]] to know, if an alias already exists.
   */
  public alias (namespace: string, alias: string): void {
    this.tracer.emit('alias', { alias, namespace })
    this._aliases[alias] = namespace
  }

  /**
   * Define an alias for an existing directory and require
   * files without fighting with relative paths.
   *
   * Giving the following directory structure
   * ```sh
   * .app/
   * ├── controllers
   * │   └── foo.js
   * ├── services
   * │   └── foo.js
   * ├── models
   * │   └── foo.js
   * ```
   *
   * You are in file `controllers/foo.js`
   *
   * ### Without autoload
   * ```js
   * require('../services/foo')
   * require('../models/foo')
   * ```
   *
   * ### With outoload
   * ```
   * ioc.autoload(join(__dirname, 'app'), 'App')
   *
   * use('App/services/foo')
   * use('App/mdoels/foo')
   * ```
   */
  public autoload (directoryPath: string, namespace: string): void {
    this.tracer.emit('autoload', { directoryPath, namespace })

    /**
     * Store namespaces in an array for faster lookup
     * during resolve phase
     */
    this._autoloadedAliases.push(namespace)
    this._autoloads[namespace] = directoryPath
  }

  /**
   * Clear the autoload cache for all the cached files or for a
   * single namespace.
   *
   * Optionally, you can remove it from `require` cache too.
   */
  public clearAutoloadCache (namespace?: string, clearRequireCache = false): void {
    if (!namespace) {
      Array.from(this._autoloadsCache.keys()).forEach((key) => {
        this._removeAutoloadFromCache(key, clearRequireCache)
      })
      return
    }

    this._removeAutoloadFromCache(namespace, clearRequireCache)
  }

  /**
   * Register a fake for an existing binding. The fakes only work when
   * `ADONIS_IOC_PROXY` environment variable is set to `true`. AdonisJs
   * will set it to true automatically during testing.
   *
   * NOTE: The return value of fakes is always cached, since multiple
   * calls to `use` after that should point to a same return value.
   *
   * @example
   * ```js
   * ioc.fake('App/User', function () {
   *  return new FakeUser()
   * })
   * ```
   */
  public fake (namespace: string, callback: IBindCallback): void {
    this.tracer.emit('fake', { namespace })
    this._fakes.set(namespace, { callback, singleton: true })
  }

  /**
   * Use the binding by resolving it from the container. The resolve method
   * does some great work to resolve the value for you.
   *
   * 1. The name will be searched for an existing binding.
   * 2. Checked against aliases.
   * 3. Checked against autoloaded directories.
   * 4. Fallback to Node.js `require` call.
   *
   * @example
   * ```js
   * ioc.use('View')                // alias
   * ioc.use('Adonis/Src/View')     // binding
   * ioc.use('App/Services/User')   // Autoload
   * ioc.use('lodash')              // Fallback to Node.js require
   * ```
   */
  public use<T> (namespace: string, relativeFrom?: string): T {
    const value = this._resolve(namespace, relativeFrom)

    if (!this._useProxies) {
      return value as T
    }

    if (this._isObject(value)) {
      return (new IoCProxyObject(namespace, value, this) as unknown) as T
    }

    if (this._isClass(value)) {
      return (IocProxyClass(namespace, value, this) as unknown) as T
    }

    return value as T
  }

  /**
   * Make an instance of class and auto inject it's dependencies. The instance
   * is only created if `namespace` is part of an autoload or is an class
   * constructor.
   *
   * The bindings added via `ioc.bind` or `ioc.singleton` controls their state
   * by themselves.
   */
  public make<T> (namespace: any, relativeFrom?: string): T {
    const value = this._resolveAndMake(namespace, relativeFrom)

    if (!this._useProxies) {
      return value as T
    }

    if (this._isObject(value)) {
      return (new IoCProxyObject(namespace, value, this) as unknown) as T
    }

    if (this._isClass(value)) {
      return (IocProxyClass(namespace, value, this) as unknown) as T
    }

    return value as T
  }

  /**
   * Use the fake for a given namespace. You don't have to manually
   * read values from this method, unless you know what you are
   * doing.
   *
   * This method is internally used by ioc container proxy objects to
   * point to a fake when `ADONIS_IOC_PROXY` is set to true and fake
   * exists.
   */
  public useFake<T> (namespace: string): T {
    const fake = this._fakes.get(namespace)

    if (!fake) {
      throw new Error(`Cannot find fake for ${namespace}`)
    }

    if (!fake.cachedValue) {
      fake.cachedValue = fake.callback(this)
    }

    return fake.cachedValue as T
  }

  /**
   * A boolean telling if a fake exists for a binding or
   * not.
   */
  public hasFake (name: string): boolean {
    return this._fakes.has(name)
  }

  /**
   * Returns a boolean telling if an alias
   * exists
   */
  public hasAlias (name: string): boolean {
    return !!this._aliases[name]
  }

  /**
   * Returns a boolean telling if binding for a given namespace
   * exists or not. Also optionally check for aliases too.
   *
   * @example
   * ```js
   * ioc.hasBinding('Adonis/Src/View')    // namespace
   * ioc.hasBinding('View')               // alias
   * ```
   */
  public hasBinding (namespace: string, checkAliases = false): boolean {
    const binding = this._bindings[namespace]
    if (!binding && checkAliases) {
      return !!this._bindings[this.getAliasNamespace(namespace)!]
    }

    return !!binding
  }

  /**
   * Returns the complete namespace for a given alias. To avoid
   * `undefined` values, it is recommended to use `hasAlias`
   * before using this method.
   */
  public getAliasNamespace (name: string): string | undefined {
    return this._aliases[name]
  }

  /**
   * Returns a boolean telling if namespace is part of autoloads or not.
   * This method results may vary from the [[use]] method, since
   * the `use` method gives prefrence to the `bindings` first.
   *
   * ### NOTE:
   * Check the following example carefully.
   *
   * @example
   * ```js
   * // Define autoload namespace
   * ioc.autoload(join(__dirname, 'app'), 'App')
   *
   * ioc.bind('App/Services/Foo', () => {
   * })
   *
   * // return true
   * ioc.isAutoloadNamespace('App/Services/Foo')
   *
   * // Returns value from `bind` and not disk
   * ioc.use('isAutoloadNamespace')
   * ```
   */
  public isAutoloadNamespace (namespace: string): boolean {
    return !!this.getAutoloadBaseNamespace(namespace)
  }

  /**
   * Returns the base namespace for an autoloaded namespace.
   *
   * @example
   * ```js
   * ioc.autoload(join(__dirname, 'app'), 'App')
   *
   * ioc.getAutoloadBaseNamespace('App/Services/Foo') // returns App
   * ```
   */
  public getAutoloadBaseNamespace (namespace: string): string | undefined {
    return this._autoloadedAliases.find((alias) => namespace.startsWith(`${alias}/`))
  }

  /**
   * Restore the fake
   */
  public restore (name: string): void {
    this._fakes.delete(name)
  }
}
