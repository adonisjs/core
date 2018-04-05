'use strict'

/*
 * adonis-fold
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const requireStack = require('require-stack')
const emitter = new (require('events'))()
const GE = require('@adonisjs/generic-exceptions')
const ServiceProvider = require('../../src/ServiceProvider')

/**
 * Registrar class is used to register and boot providers. This
 * should be done once and at the time of booting the app.
 *
 * @class Registrar
 */
class Registrar {
  constructor (Ioc) {
    this.Ioc = Ioc
    this._providers = []
  }

  /**
   * Listen for registrar specific events
   *
   * @method on
   *
   * @param {string} name
   * @param {function} callback
   */
  on (name, callback) {
    emitter.on(name, callback)
  }

  /**
   * Listen for registrar specific events
   * just for one time
   *
   * @method once
   *
   * @param {string} name
   * @param {function} callback
   */
  once (name, callback) {
    emitter.once(name, callback)
  }

  /**
   * Remove a listener
   *
   * @method removeListener
   *
   * @param {string} name
   * @param {function} callback
   */
  removeListener (name, callback) {
    emitter.removeListener(name, callback)
  }

  /**
   * Event fires when all providers have been
   * registered
   *
   * @event providers:registered
   */
  get PROVIDERS_REGISTERED () {
    return 'providers:registered'
  }

  /**
   * Event fires when all providers have been
   * booted.
   *
   * @event providers:booted
   */
  get PROVIDERS_BOOTED () {
    return 'providers:booted'
  }

  /**
   * Loop over providers array and returns an instance
   * of each provider class. It will also require
   * the files in the process.
   *
   * @private
   *
   * @method _getProvidersInstance
   *
   * @param {Array} arrayOfProviders
   *
   * @return {Array}
   */
  _getProvidersInstance (arrayOfProviders) {
    return _(arrayOfProviders)
    .uniq()
    .map((provider) => {
      const Module = requireStack(provider.trim())
      if (Module.prototype instanceof ServiceProvider === false) {
        const message = `${Module.name} must extend base service provider class`
        throw GE.RuntimeException.invoke(message, 500, 'E_INVALID_SERVICE_PROVIDER')
      }
      return new Module(this.Ioc)
    })
    .value()
  }

  /**
   * Registers the providers by calling register method on
   * them. Providers that does not contain the register
   * method will be skipped.
   *
   * @private
   *
   * @method _registerProviders
   *
   * @param {Array} providers
   */
  _registerProviders (providers) {
    _(providers)
    .filter((provider) => typeof (provider.register) === 'function')
    .each((provider) => provider.register())
  }

  /**
   * Boots the providers by calling boot method on them.
   * Providers that does have the boot method will be
   * skipped.
   *
   * @private
   *
   * @method _bootProviders
   *
   * @param {Array} providers
   *
   * @return {Promise}
   */
  _bootProviders (providers) {
    return _(providers)
    .filter((provider) => typeof (provider.boot) === 'function')
    .map((provider) => provider.boot())
    .value()
  }

  /**
   * Setting providers that will later be registered
   * and booted.
   *
   * @method providers
   *
   * @param  {Array} arrayOfProviders
   *
   * @chainable
   */
  providers (arrayOfProviders) {
    if (arrayOfProviders instanceof Array === false) {
      throw GE
        .InvalidArgumentException
        .invalidParameter('register expects an array of providers to be registered', arrayOfProviders)
    }
    this._providers = this._getProvidersInstance(arrayOfProviders)
    return this
  }

  /**
   * Register providers earlier defined via the
   * `providers` method.
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this._registerProviders(this._providers)
    this.Ioc.executeExtendCalls()
    emitter.emit(this.PROVIDERS_REGISTERED)
  }

  /**
   * Boot providers earlier defined via the
   * `providers` method.
   *
   * @method boot
   *
   * @return {void}
   */
  async boot () {
    await Promise.all(this._bootProviders(this._providers))
    emitter.emit(this.PROVIDERS_BOOTED)
  }

  /**
   * Register and boot providers together
   *
   * @method registerAndBoot
   *
   * @return {void}
   */
  async registerAndBoot () {
    this.register()
    await this.boot()
  }
}

module.exports = Registrar
