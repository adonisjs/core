'use strict'

/*
 * adonis-fold
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')
const caller = require('caller')
const _ = require('lodash')
const requireStack = require('require-stack')
const debug = require('debug')('adonis:fold')
const GE = require('@adonisjs/generic-exceptions')

const toString = Function.prototype.toString
const isClass = (fn) => {
  return typeof (fn) === 'function' && /^class\s/.test(toString.call(fn))
}

/**
 * Ioc container instance is used to register and fetch dependencies without
 * dealing with system paths. Also dependencies can be dependent upon each
 * other transparently, instead of consumer writing all the wiring code.
 * It has support for autoloading directories, defining aliases and
 * binding fakes. Check official documentation for that.
 *
 * ### Important Note
 * A single instance of this class needs to be used by the entire application.
 * The export method of the module makes sure to return the instantiated class,
 * so that you won't have to manage singleton instances and start using it
 * as `Ioc.bind`, `Ioc.make` etc directly.
 *
 * @class Ioc
 */
class Ioc {
  constructor () {
    /**
     * Store list of bindings with their closures
     *
     * @attribute _bindings
     * @private
     * @type {Object}
     */
    this._bindings = {}

    /**
     * Stores the list of aliases and namespaces
     * as key/value pair
     *
     * @attribute _aliases
     * @private
     * @type {Object}
     */
    this._aliases = {}

    /**
     * Stores list of autoloaded directories and
     * their namespaces as key/value pair
     *
     * @attribute _autoloads
     * @private
     * @type {Object}
     */
    this._autoloads = {}

    /**
     * Stores list of managers for the bindings to
     * be extended.
     *
     * @attribute _managers
     * @private
     * @type {Object}
     */
    this._managers = {}

    /**
     * Stores list of runtime fakes
     *
     * @attribute _fakes
     * @private
     * @type {Map}
     */
    this._fakes = new Map()

    /**
     * Reference to all extend calls. Extend calls
     * are executed right after all providers
     * have been booted
     *
     * @type {Object}
     */
    this._extendCalls = []
  }

  /**
   * Returns the namespace of an autoloaded directory when
   * subset of the namespace to be resolved matches. This function
   * matches the start of the string.
   *
   * ```
   * // Registered namespace: App
   * // Namespace to be resolved: App/Controllers/UsersController
   * 'App/Controllers/UsersController'.startsWith('App')
   * ```
   *
   * @method _getAutoloadedNamespace
   * @private
   *
   * @param  {String} namespace
   * @return {String}
   */
  _getAutoloadedNamespace (namespace) {
    const autoloadedKeys = _.keys(this._autoloads)
    return _.find(autoloadedKeys, (registeredNamespace) => {
      return namespace.startsWith(`${registeredNamespace}/`)
    })
  }

  /**
   * Returns whether a namespace has been registered
   * as a binding inside the IoC container or not.
   *
   * @method _isBinding
   * @private
   *
   * @param {String} name
   * @return {Boolean}
   */
  _isBinding (namespace) {
    return this._bindings[namespace]
  }

  /**
   * Returns whether the given namespace is registered as an alias
   * or not. It is does check whether the aliased namespace has
   * been registered to the IoC container or not.
   *
   * @method _isAlias
   * @private
   *
   * @param  {String}  namespace
   * @return {Boolean}
   */
  _isAlias (namespace) {
    return this._aliases[namespace]
  }

  /**
   * Returns a boolean indicating whether the namespace to
   * be resolved belongs to a autoloaded directory.
   *
   * @method _isAutoloadedPath
   * @private
   *
   * @param  {String}  namespace
   * @return {Boolean}
   */
  _isAutoloadedPath (namespace) {
    return !!this._getAutoloadedNamespace(namespace)
  }

  /**
   * Returns whether a given namespace has a manager
   * or not. Managers simply required to allow a
   * provider to be extended via Ioc container.
   *
   * @method _hasManager
   * @private
   *
   * @param  {String}  namespace
   * @return {Boolean}
   */
  _hasManager (namespace) {
    return this._managers[namespace]
  }

  /**
   * Returns whether a fake for the given namespace
   * exists or not.
   *
   * @method _hasFake
   * @private
   *
   * @param  {String}  namespace
   * @return {Boolean}
   */
  _hasFake (namespace) {
    return this._fakes.has(namespace)
  }

  /**
   * Resolves a fake for a namespace when fake
   * is registered.
   *
   * @method _resolveFake
   * @private
   *
   * @param  {String} namespace
   * @return {Mixed}
   */
  _resolveFake (namespace) {
    const fake = this._fakes.get(namespace)
    debug('resolving %s namespace as a fake', namespace)
    if (fake.singleton) {
      return (fake.cachedValue = fake.cachedValue || fake.closure(this))
    }
    return fake.closure(this)
  }

  /**
   * Resolves binding from the bindings map and returns the
   * evaluated value after calling the binding closure.
   *
   * It is important to call _isBinding before calling this
   * method to avoid exceptions being thrown.
   *
   * @method _resolveBinding
   * @private
   *
   * @param {String} namespace
   * @return {Mixed}
   */
  _resolveBinding (namespace) {
    const binding = this._bindings[namespace]
    debug('resolving %s namespace as a binding', namespace)
    if (binding.singleton) {
      return (binding.cachedValue = binding.cachedValue || binding.closure(this))
    }
    return binding.closure(this)
  }

  /**
   * Returns path of an autoloaded namespace
   *
   * @method _getAutoloadedPath
   *
   * @param  {String}           namespace
   *
   * @return {String}
   *
   * @private
   */
  _getAutoloadedPath (namespace) {
    const autoloadedNamespace = this._getAutoloadedNamespace(namespace)
    debug('resolving %s namespace from %s path', namespace, this._autoloads[autoloadedNamespace])
    return path.normalize(namespace.replace(autoloadedNamespace, this._autoloads[autoloadedNamespace]))
  }

  /**
   * Requires a file by resolving the autoloaded namespace. It
   * is important to call _isAutoloadedPath before calling
   * this method, to avoid exceptions been thrown.
   *
   * @method _resolveAutoloadedPath
   * @private
   *
   * @param  {String} namespace
   * @return {Mixed}
   */
  _resolveAutoloadedPath (namespace) {
    const result = requireStack(this._getAutoloadedPath(namespace))
    if (!result) {
      return result
    }

    const hooks = result.IocHooks || result.iocHooks
    if (!_.isArray(hooks)) {
      return result
    }

    hooks.forEach((hook) => {
      if (_.isFunction(result[hook])) {
        result[hook]()
      }
    })
    return result
  }

  /**
   * Returns instance of an object if it is a valid
   * ES6 class. Also injects the dependencies
   * defined under static inject method.
   *
   * If `Item` is not a class, it will return the
   * input back as output.
   *
   * @method _makeInstanceOf
   * @private
   *
   * @param  {Mixed} Item
   * @return {Mixed}
   *
   * @example
   * ```
   * class Foo {
   *   static get inject () {
   *     return ['App/Bar']
   *   }
   *
   *   constructor (Bar) {
   *     this.Bar = Bar
   *   }
   * }
   *
   * Ioc._makeInstanceOf(Foo)
   * ```
   */
  _makeInstanceOf (Item) {
    if (!isClass(Item) || Item.makePlain) {
      return Item
    }

    const injections = (Item.inject || []).map((injection) => {
      return this.make(injection)
    })
    return new Item(...injections)
  }

  /**
   * Requires a file just like node.js native require.
   *
   * @private
   * @method _require
   *
   * @param {String} namespace
   * @return {Mixed}
   *
   * @throws Error when unable to load the module
   */
  _require (namespace) {
    if (namespace.startsWith('./') || namespace.startsWith('/')) {
      /**
       * Since _require method is first called by this module, we
       * need to fetch the 2nd caller.
       */
      const callerPath = path.dirname(caller(2))
      return requireStack(path.join(callerPath, namespace))
    }

    debug('falling back to native require for %s namespace', namespace)
    return requireStack(namespace)
  }

  /**
   * Returns a cloned copy of registered bindings.
   *
   * @method getBindings
   *
   * @return {Object}
   */
  getBindings () {
    return _.clone(this._bindings)
  }

  /**
   * Returns a cloned copy of registered aliases.
   *
   * @method getBindings
   *
   * @return {Object}
   */
  getAliases () {
    return _.clone(this._aliases)
  }

  /**
   * Returns a cloned copy of registered autoloaded
   * directories and their namespaces.
   *
   * @method getAutoloads
   *
   * @return {Object}
   */
  getAutoloads () {
    return _.clone(this._autoloads)
  }

  /**
   * Returns a cloned copy of managers.
   *
   * @method getManagers
   *
   * @return {Object}
   */
  getManagers () {
    return _.clone(this._managers)
  }

  /**
   * Returns a map of fakes
   *
   * @method getFakes
   *
   * @return {Map}
   */
  getFakes () {
    return new Map(this._fakes)
  }

  /**
   * Registers an alias for a namespace. It is okay
   * if that namespace does not exists when alias
   * is defined.
   *
   * @method alias
   *
   * @param  {String} namespace
   * @param  {String} alias
   *
   * @example
   * ```
   * Ioc.alias('Adonis/Src/View', 'View')
   * ```
   */
  alias (namespace, alias) {
    debug('defining %s as an alias for %s namespace', alias, namespace)
    this._aliases[alias] = namespace
  }

  /**
   * Autoloads a given directory within the given namespace.
   * Value of `pathTo` must be an absolute path, Also this
   * method does not check if the path exists or not.
   *
   * @method autoload
   *
   * @param  {String} pathTo
   * @param  {String} namespace
   *
   * @example
   * ```
   * Ioc.autoload(path.join(__dirname, './app'), 'App')
   * ```
   */
  autoload (pathTo, namespace) {
    this._autoloads[namespace] = pathTo
  }

  /**
   * Binds a namespace to the Ioc container as a binding. Given
   * closure is a factory method, called everytime the binding
   * is resolved and return value of closure will be returned
   * back.
   *
   * @method bind
   *
   * @param {String} namespace
   * @param {Function} closure
   * @throws InvalidArgumentException if closure is not a function
   *
   * @example
   * ```
   * Ioc.bind('App/Foo', (app) => {
   *   const Config = app.use('Adonis/Src/Config')
   *
   *   class Foo {
   *     constructor (Config) {
   *     }
   *   }
   *
   *   return new Foo(Config)
   * })
   * ```
   */
  bind (namespace, closure) {
    if (typeof (closure) !== 'function') {
      throw GE.InvalidArgumentException.invalidParameter('Ioc.bind expects 2nd parameter to be a closure', closure)
    }

    debug('binding %s namespace to ioc container', namespace)

    this._bindings[namespace] = {
      closure,
      singleton: false,
      cachedValue: null
    }
  }

  /**
   * Similar to bind except it will bind the namespace as
   * a singleton and will call the closure only once.
   *
   * @method singleton
   *
   * @param {String} namespace
   * @param {Function} closure
   * @throws InvalidArgumentException if closure is not a function
   *
   * @example
   * ```
   * Ioc.singleton('App/Foo', (app) => {
   *   const Config = app.use('Adonis/Src/Config')
   *
   *   class Foo {
   *     constructor (Config) {
   *     }
   *   }
   *
   *   return new Foo(Config)
   * })
   * ```
   */
  singleton (namespace, closure) {
    if (typeof (closure) !== 'function') {
      throw GE
        .InvalidArgumentException
        .invalidParameter('Ioc.singleton expects 2nd parameter to be a closure', closure)
    }

    debug('binding %s namespace as singleton to ioc container', namespace)

    this._bindings[namespace] = {
      closure,
      singleton: true,
      cachedValue: null
    }
  }

  /**
   * Registers a manager for a binding. Managers are registered
   * to tell Ioc container that binding can be extended by the
   * outside world using `Ioc.extend` method.
   *
   * It is okay to register the manager before registering the
   * actual binding.
   *
   * @method manager
   *
   * @param  {String} namespace
   * @param  {Mixed} bindingInterface
   * @throws {InvalidArgumentException} If bindingInterface does not have extend method.
   *
   * @example
   * ```
   * class Foo {
   *   static extend (driver, implmentation) {
   *     this.drivers[driver] = implementation
   *   }
   * }
   *
   * // Inside provider
   * this.manager('App/Foo', Foo)
   * ```
   *
   * @example
   * ```
   * Ioc.extend('App/Foo', 'my-driver', function (app) {
   *   const Config = app.use('Adonis/Src/Config')
   *   return new MyDriverClass(Config)
   * })
   * ```
   */
  manager (namespace, bindingInterface) {
    if (typeof (bindingInterface.extend) !== 'function') {
      const message = `Make sure ${namespace} does have a extend method. Report this issue to the provider author`
      throw GE.InvalidArgumentException.invoke(message, 500, 'E_INVALID_IOC_MANAGER')
    }

    debug('exposing %s namespace to be extended by outside world', namespace)
    this._managers[namespace] = bindingInterface
  }

  /**
   * Extends a binding by the calling the extend method
   * on the registered manager.
   *
   * @method extend
   *
   * @param  {String}    namespace
   * @param  {String}    key
   * @param  {Function}  closure
   * @param  {...Spread} [options]
   *
   * @throws {InvalidArgumentException} If binding is not supposed to be extended
   * @throws {InvalidArgumentException} If closure is not a function
   *
   * @example
   * ```
   * Ioc.extend('Adonis/Src/Session', 'mongo', () => {
   *   return new MongoDriver()
   * })
   * ```
   */
  extend (...args) {
    this._extendCalls.push(args)
  }

  /**
   * Executes all extend calls in sequence. Successfully
   * executed extend calls will be removed from the
   * array, so that they are not executed again.
   *
   * @method executeExtendCalls
   *
   * @return {void}
   */
  executeExtendCalls () {
    _.remove(this._extendCalls, ([ namespace, key, closure, ...options ]) => {
      if (!this._hasManager(namespace)) {
        const message = `${namespace} cannot be extended, since their is no public interface to extend`
        throw GE.InvalidArgumentException.invoke(message, 500, 'E_CANNOT_EXTEND_BINDING')
      }

      if (typeof (closure) !== 'function') {
        throw GE.InvalidArgumentException.invalidParameter('Ioc.extend expects 3rd parameter to be a closure', closure)
      }

      const resolvedValue = closure(this)
      debug('extending %s namespace %j', namespace, { key, options: [...options] })
      this._managers[namespace].extend(key, resolvedValue, ...options)
      return true
    })
  }

  /**
   * Registers a fake for a namespace, quite helpful
   * when writing tests.
   *
   * @method fake
   *
   * @param  {String} namespace
   * @param  {Function} closure
   *
   * @throws {InvalidArgumentException} If closure is not a function
   *
   * @example
   * ```
   * Ioc.fake('Adonis/Src/Lucid', function () {
   *   return FakeModel
   * })
   *
   * // Restore after testing
   * Ioc.restore('Adonis/Src/Lucid')
   * ```
   */
  fake (namespace, closure) {
    if (typeof (closure) !== 'function') {
      throw GE.InvalidArgumentException.invalidParameter('Ioc.fake expects 2nd parameter to be a closure', closure)
    }

    debug('creating fake for %s namespace', namespace)
    this._fakes.set(namespace, { closure, singleton: false, cachedValue: null })
  }

  /**
   * Registers a single fake for a namespace, quite helpful
   * when writing tests.
   *
   * @method singletonFake
   *
   * @param  {String} namespace
   * @param  {Function} closure
   *
   * @throws {InvalidArgumentException} If closure is not a function
   *
   * @example
   * ```
   * Ioc.singletonFake('Adonis/Src/Lucid', function () {
   *   return new FakeModel()
   * })
   *
   * // Restore after testing
   * Ioc.restore('Adonis/Src/Lucid')
   * ```
   */
  singletonFake (namespace, closure) {
    if (typeof (closure) !== 'function') {
      throw GE.InvalidArgumentException.invalidParameter('Ioc.singletonFake expects 2nd parameter to be a closure', closure)
    }

    debug('creating singleton fake for %s namespace', namespace)
    this._fakes.set(namespace, { closure, singleton: true, cachedValue: null })
  }

  /**
   * Restores fake(s).
   *
   * @method restore
   *
   * @param  {...Spread|Array} namespaces
   *
   * @example
   * ```
   * Ioc.restore('Adonis/Src/Lucid')
   * Ioc.restore('Adonis/Src/Lucid', 'Adonis/Src/Config')
   * Ioc.restore() // restore all
   * ```
   */
  restore (...namespaces) {
    namespaces = namespaces[0] instanceof Array ? namespaces[0] : namespaces
    if (!namespaces.length) {
      debug('restoring all fakes')
      this._fakes.clear()
    }
    debug('restoring %d fakes', namespaces)
    namespaces.forEach((namespace) => this._fakes.delete(namespace))
  }

  /**
   * Attempts to resolve a namespace in following order.
   *
   * 1. Look for a registered fake.
   * 2. Look for a registered binding.
   * 3. Look for an alias, if found: Repeat step 1 with alias namespace.
   * 4. Look for an autoload module path.
   * 5. Fallback to native require method.
   *
   * @method use
   *
   * @param {String} namespace
   * @return {Mixed} resolved value
   *
   * @example
   * ```
   *  Ioc.use('View') // via alias
   *  Ioc.use('Adonis/Src/View') // via complete namespace
   *  Ioc.use('App/Http/Controllers/UsersController') // autoloaded namespace
   *  Ioc.use('lodash') // node module
   * ```
   */
  use (namespace) {
    if (this._hasFake(namespace)) {
      return this._resolveFake(namespace)
    }

    if (this._isBinding(namespace)) {
      return this._resolveBinding(namespace)
    }

    if (this._isAlias(namespace)) {
      return this.use(this._aliases[namespace])
    }

    if (this._isAutoloadedPath(namespace)) {
      return this._resolveAutoloadedPath(namespace)
    }

    return this._require(namespace)
  }

  /**
   * Works as same as the `use` method, but instead returns
   * an instance of the class when resolved value is a
   * ES6 class and not a registered binding. Bindings
   * registered via `Ioc.bind` are themselves
   * supposed to return the final value.
   *
   * Also you can pass a class object by reference to return
   * a automatically resolved instance.
   *
   * @method make
   *
   * @param  {String} namespace
   * @return {Mixed}
   *
   * @example
   * ```
   * class Foo {
   *   static get inject () {
   *     return ['App/Bar']
   *   }
   *
   *   constructor (bar) {
   *     this.bar = bar
   *   }
   * }
   *
   * const fooInstance = Ioc.make(Foo)
   * ```
   */
  make (namespace) {
    if (typeof (namespace) !== 'string') {
      return this._makeInstanceOf(namespace)
    }

    if (this._hasFake(namespace)) {
      return this._resolveFake(namespace)
    }

    if (this._isBinding(namespace)) {
      return this._resolveBinding(namespace)
    }

    if (this._isAlias(namespace)) {
      return this.make(this._aliases[namespace])
    }

    if (this._isAutoloadedPath(namespace)) {
      return this._makeInstanceOf(this._resolveAutoloadedPath(namespace))
    }

    return this._require(namespace)
  }

  /**
   * Returns absolute path to a namespace
   *
   * @method getPath
   *
   * @param  {String} namespace
   *
   * @return {String}
   *
   * @throws {Exception} If namespace is not part of autoloaded directories.
   */
  getPath (namespace) {
    if (this._isAutoloadedPath(namespace)) {
      return this._getAutoloadedPath(namespace)
    }

    throw GE
      .RuntimeException
      .invoke(`Cannot get path, since ${namespace} is not a valid autoloaded namespace`, 500, 'E_CANNOT_GET_NAMESPACE_PATH')
  }

  /**
   * Same as `make` but instead returns the instance of the object
   * with the check that a method exists on the resolved object.
   * If that method does not exists it will throw an exception.
   *
   * It is helpful for scanerios like Route controller binding.
   *
   * @method makeFunc
   *
   * @param  {String} pattern
   * @return {Object}
   *
   * @throws {InvalidArgumentException} If pattern is not a string with dot notation.
   * @throws {RuntimeException} If method on the given namespace is missing.
   *
   * @example
   * ```
   * Ioc.makeFunc('App/Http/Controllers/UsersController.index')
   * // returns
   * { instance: UsersControllerInstance, method: index }
   * // usage
   * instance[method].apply(instance, [...args])
   * ```
   */
  makeFunc (pattern) {
    const [namespace, method, ...rest] = pattern.split(/\b\./g)
    if (!namespace || !method || rest.length) {
      const message = `Ioc.makeFunc expects a string in module.method format instead received ${pattern}`
      throw GE.InvalidArgumentException.invoke(message, 500, 'E_INVALID_MAKE_STRING')
    }

    const normalizedNamespace = namespace.replace(/\\./g, '.')
    const instance = this.make(normalizedNamespace)

    if (!instance[method]) {
      throw GE.RuntimeException.invoke(`Method ${method} missing on ${normalizedNamespace}`, 500, 'E_UNDEFINED_METHOD')
    }
    return { instance, method: instance[method].bind(instance) }
  }
}

module.exports = Ioc
