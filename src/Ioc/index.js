'use strict'

/**
 * adonis-fold
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const helpers = require('./helpers')
const _ = require('lodash')
const requireStack = require('require-stack')
const CatLog = require('cat-log')
const CE = require('../Exceptions')
const log = new CatLog('adonis:ioc')
const EventEmitter2 = require('eventemitter2').EventEmitter2
const emitter = new EventEmitter2({
  wildcard: false,
  newListener: false
})

/**
 * fakes to be used for testing
 *
 * @type {Object}
 */
let fakes = {}

/**
 * list of registered providers
 * @type {Object}
 * @private
 */
let providers = {}

/**
 * list of managers exposed by providers
 * they should have implemented extend
 * method
 * @type {Object}
 * @private
 */
let providerManagers = {}

/**
 * list of providers extenders
 * @type {Object}
 * @private
 */
let providerExtenders = {}

/**
 * namespace and directory path
 * to be treated as autoload
 * @private
 */
let autoloadDirectory = {}

/**
 * binding alisaes
 * @type {Object}
 * @private
 */
let aliases = {}

/**
 * @module Ioc
 * @description Ioc container to store and resolve
 * depedencies with solid dependency injection.
 */

let Ioc = exports = module.exports = {}

/**
 * @description binding namespace to a given closure which
 * is executed everytime a namespace is fetched.
 * @method _bind
 * @param  {String} namespace
 * @param  {Function} closure
 * @param  {Boolean} singleton
 * @return {void}
 * @private
 */
Ioc._bind = function (namespace, closure, singleton) {
  if (typeof (closure) !== 'function') {
    throw CE.InvalidArgumentException.invalidParameters('Ioc.bind expects 2nd parameter to be a closure')
  }
  namespace = namespace.trim()
  log.verbose('binding %s to ioc container', namespace)
  emitter.emit('bind:provider', namespace, singleton)
  providers[namespace] = {closure, singleton, instance: null}
}

/**
 * @description clears of all local data, like its a new
 * instance
 * @method new
 * @return {void} [description]
 * @public
 */
Ioc.new = function () {
  providers = {}
  providerManagers = {}
  providerExtenders = {}
  autoloadDirectory = {}
  aliases = {}
}

/**
 * @description resolves eagerly loaded provider
 * by setting up dependencies in right order
 * @method _resolveProvider
 * @param  {String} namespace
 * @return {*}
 * @private
 */
Ioc._resolveProvider = function (namespace) {
  log.verbose('resolving provider %s', namespace)
  const provider = providers[namespace]
  if (!provider.singleton) {
    const returnValue = provider.closure(Ioc)
    emitter.emit('provider:resolved', namespace, returnValue)
    return returnValue
  }
  provider.instance = provider.instance || provider.closure(Ioc)
  emitter.emit('provider:resolved', namespace, provider.instance)
  return provider.instance
}

/**
 * resolves a fake for the fakes list
 *
 * @param   {String} namespace
 *
 * @return  {Mixed}
 *
 * @private
 */
Ioc._resolveFake = function (namespace) {
  return fakes[namespace].closure(Ioc)
}

/**
 * @description calls provider extenders in a sequence
 * and pass key/return value to provider extend
 * method.
 * @method _extendProvider
 * @param  {String}        namespace
 * @return {void}
 * @private
 */
Ioc._extendProvider = function (namespace) {
  if (providerExtenders[namespace] && providerManagers[namespace]) {
    const extender = providerExtenders[namespace]
    const manager = providerManagers[namespace]
    _.each(extender, function (item) {
      const key = item.key
      const args = item.args
      const closureOutput = item.closure(Ioc)
      const methodArgs = [key, closureOutput].concat(args)
      manager.extend.apply(manager, methodArgs)
    })
    providerExtenders[namespace] = []
  }
}

/**
 * autoloads a given file by making dynamic path
 * from namespace registered for autoloading
 * @method _autoLoad
 * @param  {String}  namespace
 * @return {*}
 * @private
 */
Ioc._autoLoad = function (namespace) {
  const namespacePath = namespace.replace(autoloadDirectory.namespace, autoloadDirectory.directoryPath)
  log.verbose('resolving %s from path %s', namespace, namespacePath)
  try {
    let result = requireStack(namespacePath)
    /**
     * autoloaded paths can have multiple hooks to be called
     * everytime it is required. Lucid is an example of
     * making use of it.
     */
    if (result.IocHooks && result.IocHooks.forEach) {
      result.IocHooks.forEach(function (hook) {
        if (typeof (result[hook]) === 'function') {
          result[hook]()
        }
      })
    }
    emitter.emit('module:resolved', namespace, namespacePath, result)
    return result
  } catch (e) {
    throw e
  }
}

/**
 * @description returns whether variable is a class or not
 * @method _isClass
 * @param  {Mixed}  Binding
 * @return {Boolean}
 * @private
 */
Ioc._isClass = function (Binding) {
  return typeof (Binding) === 'function' && typeof (Binding.constructor) === 'function' && Binding.name
}

/**
 * @description returns type of binding based on
 * its existence inside providers, autoload
 * path etc.
 * @method _type
 * @param  {String} binding [description]
 * @return {String}         [description]
 * @private
 */
Ioc._type = function (binding) {
  if (typeof (binding) !== 'string') {
    return 'UNKNOWN'
  }

  if (fakes[binding]) {
    return 'FAKE'
  }

  if (providers[binding]) {
    return 'PROVIDER'
  }

  if (aliases[binding]) {
    return 'ALIAS'
  }

  if (helpers.isAutoLoadPath(autoloadDirectory, binding)) {
    return 'AUTOLOAD'
  }
}

/**
 * @description returns all registered providers
 * @method getProviders
 * @return {Object}
 * @public
 */
Ioc.getProviders = function () {
  return providers
}

/**
 * @description returns all registered managers
 * @method getManagers
 * @return {Object}
 * @public
 */
Ioc.getManagers = function () {
  return providerManagers
}

/**
 * @description returns all extend hooks
 * on service providers
 * @method getExtenders
 * @return {Object}
 * @public
 */
Ioc.getExtenders = function () {
  return providerExtenders
}

/**
 * @description register an object to a given namespace
 * which can be resolved out of Ioc container
 * @method bind
 * @param  {String} namespace
 * @param  {Function} closure
 * @return {void}
 * @throws {InvalidArgumentException} If closure is a not a function
 * @public
 */
Ioc.bind = function (namespace, closure) {
  Ioc._bind(namespace, closure, false)
}

/**
 * @description register an object as singleton to a given
 * namespace which can be resolved out of Ioc container
 * @method singleton
 * @param  {String} namespace
 * @param  {Function} closure
 * @return {void}
 * @throws {InvalidArgumentException} If closure is a not a function
 * @public
 */
Ioc.singleton = function (namespace, closure) {
  Ioc._bind(namespace, closure, true)
}

/**
 * @description register an object as a manager class which
 * needs to have extend method. It is binding required
 * to expose extend functionality
 * @method manager
 * @param  {String} namespace
 * @param  {*} defination
 * @return {void}
 * @throws {IncompleteImplementation} If defination does not have extend method
 * @example
 *   Ioc.manager('Adonis/Addons/Cache',CacheManager)
 * @public
 */
Ioc.manager = function (namespace, defination) {
  if (!defination.extend) {
    throw CE.InvalidArgumentException.invalidIocManager(namespace)
  }
  log.verbose('registering manager for %s', namespace)
  providerManagers[namespace] = defination
}

/**
 * @description extends provider manager with the
 * power of type hinting dependencies
 * @method extend
 * @param  {String} namespace
 * @param  {String} key
 * @param  {Function} closure
 * @return {void}
 * @example
 *     Ioc.extend('Adonis/Addons/Cache', 'redis', function (app) {
 *
 *     })
 * @public
 */
Ioc.extend = function (namespace, key, closure) {
  if (typeof (closure) !== 'function') {
    throw CE.InvalidArgumentException.invalidParameters('Ioc.extend expects 3rd parameter to be a closure')
  }
  const args = _.drop(_.toArray(arguments), 3)
  log.verbose('extending %s adding %s', namespace, key)
  emitter.emit('extend:provider', key, namespace)
  providerExtenders[namespace] = providerExtenders[namespace] || []
  providerExtenders[namespace].push({key, closure, args})
}

/**
 * @description setting up a directory to be autoloaded
 * under a given namespace
 * @method autoload
 * @param  {String} namespace
 * @param  {String} directoryPath
 * @return {void}
 * @public
 */
Ioc.autoload = function (namespace, directoryPath) {
  emitter.emit('bind:autoload', namespace, directoryPath)
  log.verbose('autoloading directory is set to %s under %s namespace', directoryPath, namespace)
  autoloadDirectory = {namespace, directoryPath}
}

/**
 * @description resolve any binding from ioc container
 * using it's namespace.
 * @method use
 * @param  {String} namespace
 * @return {*}
 * @public
 */
Ioc.use = function (namespace) {
  const type = Ioc._type(namespace)

  switch (type) {
    case 'FAKE':
      return Ioc._resolveFake(namespace)
    case 'PROVIDER':
      Ioc._extendProvider(namespace)
      return Ioc._resolveProvider(namespace)
    case 'AUTOLOAD':
      return Ioc._autoLoad(namespace)
    case 'ALIAS':
      return Ioc.use(aliases[namespace])
    default:
      return requireStack(namespace)
  }
}

/**
 * @description sets up aliases using an object
 * @method aliases
 * @param  {Object} hash
 * @return {void}
 * @public
 */
Ioc.aliases = function (hash) {
  _.each(hash, function (value, key) {
    Ioc.alias(key, value)
  })
}

/**
 * @description alias any namespace registered under
 * ioc container
 * @method alias
 * @param  {String} key
 * @param  {String} namespace
 * @return {void}
 * @public
 */
Ioc.alias = function (key, namespace) {
  log.verbose('%s has been aliased as %s', namespace, key)
  emitter.emit('bind:alias', key, namespace)
  aliases[key] = namespace
}

/**
 * make an instance of class by injecting
 * required dependencies.
 * @method make
 * @param {Object} Binding
 * @return {*}
 * @public
 */
Ioc.make = function (Binding) {
  const _bind = Function.prototype.bind
  const type = Ioc._type(Binding)

  /**
   * if binding type is a provider or alias, we should simply
   * return the binding from container and should not act
   * smart
   */
  if (type === 'PROVIDER' || type === 'ALIAS' || type === 'FAKE') {
    return Ioc.use(Binding)
  }

  /**
   * if binding is autoload, than we should transform
   * the binding value by requiring it
   */
  if (type === 'AUTOLOAD') {
    Binding = Ioc.use(Binding)
  }

  /**
   * if binding is a string and is not part of autoload directory
   * we should try to require it and return output
   */
  if (type !== 'AUTOLOAD' && typeof (Binding) === 'string') {
    return requireStack(Binding)
  }

  /**
   * if binding is not a class or makePlain is defined as
   * true, then we should return it's original value.
   */
  if (!Ioc._isClass(Binding) || Binding.makePlain) {
    return Binding
  }

  /**
   * if binding is a valid class, make an instance
   * of it by injecting dependencies
   */
  log.verbose('making class %s', Binding.name)
  const injections = Binding.inject || helpers.introspect(Binding.toString())
  if (!injections || _.size(injections) === 0) {
    return new Binding()
  }

  const resolvedInjections = _.map(injections, function (injection) {
    return Ioc.make(injection)
  })

  return new (_bind.apply(Binding, [null].concat(resolvedInjections)))()
}

/**
 * @description it makes class instance using its namespace
 * and return requested method.
 * @method makeFunc
 * @param  {String} Binding
 * @return {Object}
 * @public
 */
Ioc.makeFunc = function (Binding) {
  const parts = Binding.split('.')
  if (parts.length !== 2) {
    throw CE.InvalidArgumentException.invalidMakeString(Binding)
  }

  const instance = Ioc.make(parts[0])
  const method = parts[1]

  if (!instance[method]) {
    throw CE.RuntimeException.missingMethod(parts[0], method)
  }
  return {instance, method}
}

/**
 * registers fake for a given namespace
 *
 * @param  {String} namespace
 * @param  {Function} closure
 *
 * @public
 */
Ioc.fake = function (namespace, closure) {
  if (typeof (closure) !== 'function') {
    throw CE.InvalidArgumentException.invalidParameters('Ioc.fake expects 2nd parameter to be a closure')
  }
  namespace = namespace.trim()
  fakes[namespace] = {closure}
}

/**
 * adding methods of the event emitter
 */
Ioc.on = emitter.on.bind(emitter)
Ioc.once = emitter.once.bind(emitter)
Ioc.listenerCount = emitter.listenerCount.bind(emitter)
Ioc.removeListener = emitter.removeListener.bind(emitter)
Ioc.removeAllListeners = emitter.removeAllListeners.bind(emitter)
Ioc.emit = emitter.emit.bind(emitter)
