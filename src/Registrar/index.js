'use strict'

/**
  * adonis-fold
  * Copyright(c) 2015-2015 Harminder Virk
  * MIT Licensed
*/

const parallel = require('co-parallel')
const co = require('co')
const Ioc = require('../Ioc')
const _ = require('lodash')
const requireStack = require('require-stack')

let Registrar = exports = module.exports = {}

/**
 * map over all the providers and return an array
 * of unique providers
 *
 * @param   {Array} arrayOfProviders
 *
 * @return  {Array}                  [description]
 *
 * @private
 */
Registrar._mapProviders = function (arrayOfProviders) {
  return _.chain(arrayOfProviders)
  .unique()
  .map(function (provider) {
    provider = provider.trim()
    const Module = requireStack(provider)
    return new Module()
  }).value()
}

/**
 * calls register method on all the given providers
 *
 * @param  {Array} providers
 *
 * @return {Array}
 */
Registrar._callRegister = function (providers) {
  return _(providers)
  .filter((provider) => typeof (provider.register) === 'function')
  .map((provider) => provider.register())
  .value()
}

/**
 * call boot method on provider if defined
 *
 * @param  {Array} providers
 *
 * @return {Array}
 */
Registrar._callBoot = function (providers) {
  return _(providers)
  .filter((provider) => typeof (provider.boot) === 'function')
  .map((provider) => provider.boot())
  .value()
}

/**
 * registers an array of providers by
 * called their register method.
 *
 * @param  {Array} arrayOfProviders
 *
 * @return {void}
 *
 * @public
 */
Registrar.register = function (arrayOfProviders) {
  const providers = Registrar._mapProviders(arrayOfProviders)
  return co(function * () {
    yield parallel(Registrar._callRegister(providers))
    Ioc.emit('providers:registered')
    yield parallel(Registrar._callBoot(providers))
    Ioc.emit('providers:booted')
  })
}
