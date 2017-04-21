'use strict'

/*
 * adonis-fold
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Resolver = require('./index')

/**
 * ResolverManager is the public interface to
 * register directories and resolve them
 * later.
 *
 * The registering process needs to be only done once by
 * the application not by providers. Providers should
 * assume that the registering process is done in
 * advance and only call functions to resolve
 * bindings.
 *
 * @class ResolveManager
 * @static
 */
class ResolverManager {
  constructor (Ioc) {
    this._appNamespace = null
    this._directories = {}
    this._Ioc = Ioc
  }

  /**
   * Returns instance of resolver.
   *
   * @method _getInstance
   *
   * @param  {String}     [forDir = null]
   *
   * @return {Resolver}
   *
   * @private
   */
  _getInstance (forDir = null) {
    return new Resolver(this._Ioc, this._directories, this._appNamespace, forDir)
  }

  /**
   * Register directories to be used for making
   * namespaces
   *
   * @method directories
   *
   * @param  {Object}    dirs
   *
   * @chainable
   */
  directories (dirs) {
    this._directories = dirs
    return this
  }

  /**
   * Set app namespace to be used for making
   * complete namespaces from relative
   * namespaces.
   *
   * @method appNamespace
   *
   * @param  {String}     namespace
   *
   * @chainable
   */
  appNamespace (namespace) {
    this._appNamespace = namespace
    return this
  }

  /**
   * Returns the resolver instance specified
   * to translate namespace for a given
   * directory only.
   *
   * @method forDir
   *
   * @param  {String} forDir
   *
   * @return {Resolver}
   */
  forDir (forDir) {
    return this._getInstance(forDir)
  }

  /**
   * Translate binding using resolver translate
   * method.
   */
  translate (...params) {
    return this._getInstance().translate(...params)
  }

  /**
   * Resolve binding using resolver resolve
   * method.
   */
  resolve (...params) {
    return this._getInstance().resolve(...params)
  }

  /**
   * Resolve binding using resolver resolveFunc
   * method.
   */
  resolveFunc (...params) {
    return this._getInstance().resolveFunc(...params)
  }
}

module.exports = ResolverManager
