'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ServiceProvider } = require('adonis-fold')

class AppProvider extends ServiceProvider {
  register () {
    this._registerConfig()
    this._registerRequest()
    this._registerResponse()
    this._registerRoute()
    this._registerServer()
  }

  /**
   * Registering the config provider under
   * Adonis/Src/Config namespace
   *
   * @method _registerConfig
   *
   * @return {void}
   *
   * @private
   */
  _registerConfig () {
    this.app.singleton('Adonis/Src/Config', (app) => {
      const Helpers = app.use('Adonis/Src/Helpers')
      const Config = require('../src/Config')
      return new Config(Helpers.configPath())
    })
  }

  /**
   * Registering the request provider under
   * Adonis/Src/Request namespace
   *
   * @method _registerRequest
   *
   * @return {void}
   *
   * @private
   */
  _registerRequest () {
    this.app.bind('Adonis/Src/Request', () => {
      return require('../src/Request')
    })
  }

  /**
   * Registering the response provider under
   * Adonis/Src/Response namespace
   *
   * @method _registerResponse
   *
   * @return {void}
   *
   * @private
   */
  _registerResponse () {
    this.app.bind('Adonis/Src/Response', () => {
      return require('../src/Response')
    })
  }

  /**
   * Registering the route provider under
   * Adonis/Src/Route namespace
   *
   * @method _registerRoute
   *
   * @return {void}
   *
   * @private
   */
  _registerRoute () {
    this.app.singleton('Adonis/Src/Route', () => {
      return require('../src/Route/Manager')
    })
  }

  /**
   * Register the server provider under
   * Adonis/Src/Server namespace.
   *
   * @method _registerServer
   *
   * @return {void}
   *
   * @private
   */
  _registerServer () {
    this.app.singleton('Adonis/Src/Server', (app) => {
      const Request = app.use('Adonis/Src/Request')
      const Response = app.use('Adonis/Src/Response')
      const Route = app.use('Adonis/Src/Route')
      const Config = app.use('Adonis/Src/Config')
      const Logger = {
        info (...args) {
          console.log(...args)
        }
      }

      const Server = require('../src/Server')
      return new Server(Request, Response, Route, Logger, Config)
    })
  }
}

module.exports = AppProvider
