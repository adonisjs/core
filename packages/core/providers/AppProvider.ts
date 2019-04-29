/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Router } from '@adonisjs/router'
import { Exception } from '@adonisjs/utils'
import { IocContract } from '@adonisjs/fold'
import { Request, requestConfig } from '@adonisjs/request'
import { Response, responseConfig } from '@adonisjs/response'
import { Server, MiddlewareStore, routePreProcessor } from '@adonisjs/server'
import { BodyParserMiddleware, bodyParserConfig } from '@adonisjs/bodyparser'

import { Env } from '../src/Env'
import { Logger } from '../src/Logger'
import { Config } from '../src/Config'
import { exceptionCodes } from '../lib'
import { Encryption } from '../src/Encryption'
import { loggerConfig } from '../config/logger'
import { requestBindings } from '../src/Bindings/Request'

export default class AppProvider {
  constructor (protected $container: IocContract) {}

  private _getAppKey (): string {
    const appKey = this.$container.use('Adonis/Src/Config').get('app.appKey')
    if (!appKey) {
      throw new Exception('Define appKey inside config/app file', 500, exceptionCodes.E_MISSING_APP_KEY)
    }
    return appKey
  }

  /**
   * Registers the env provider to the IoC container.
   *
   * Namespace: Adonis/Src/Env
   * Alias: Env
   */
  private _registerEnv () {
    this.$container.singleton('Adonis/Src/Env', () => {
      const Helpers = this.$container.use('Adonis/Src/Helpers')
      return new Env(Helpers.appRoot())
    })

    this.$container.alias('Adonis/Src/Env', 'Env')
  }

  /**
   * Register config provider to the IoC container.
   *
   * Namespace: Adonis/Src/Config
   * Alias: Config
   */
  private _registerConfig () {
    this.$container.singleton('Adonis/Src/Config', () => {
      const Helpers = this.$container.use('Adonis/Src/Helpers')
      return new Config(Helpers.configPath())
    })

    this.$container.alias('Adonis/Src/Config', 'Config')
  }

  /**
   * Register Http middleware store to the IoC container
   *
   * Namespace: Adonis/Src/HttpMiddleware
   * Alias: HttpMiddleware
   */
  private _registerHttpMiddleware () {
    this.$container.singleton('Adonis/Src/HttpMiddleware', () => {
      return new MiddlewareStore()
    })

    this.$container.alias('Adonis/Src/HttpMiddleware', 'HttpMiddleware')
  }

  /**
   * Registers Request class to the IoC container
   *
   * Namespace: Adonis/Src/Request
   * Alias: NONE
   */
  private _registerRequest () {
    this.$container.singleton('Adonis/Src/Request', () => {
      return Request
    })
  }

  /**
   * Registers Response class to the IoC container
   *
   * Namespace: Adonis/Src/Response
   * Alias: NONE
   */
  private _registerResponse () {
    this.$container.singleton('Adonis/Src/Response', () => {
      return Response
    })
  }

  /**
   * Register router to the IoC container
   *
   * Namespace: Adonis/Src/Route
   * Alias: Route
   */
  private _registerRoute () {
    this.$container.singleton('Adonis/Src/Route', (app) => {
      return new Router((route) => routePreProcessor(route, app.use('Adonis/Src/HttpMiddleware')))
    })

    this.$container.alias('Adonis/Src/Route', 'Route')
  }

  /**
   * Register logger provider to the IoC container.
   *
   * Namespace: Adonis/Src/Logger
   * Alias: Logger
   */
  private _registerLogger () {
    this.$container.singleton('Adonis/Src/Logger', (app) => {
      const loggerConfig = app.use('Adonis/Src/Config').get('app.logger', {})
      return new Logger(loggerConfig)
    })

    this.$container.alias('Adonis/Src/Logger', 'Logger')
  }

  /**
   * Registers encryption provider under `Adonis/Src/Encryption`
   * namespace.
   */
  private _registerEncryption () {
    this.$container.singleton('Adonis/Src/Encryption', () => {
      return new Encryption(this._getAppKey())
    })

    this.$container.alias('Adonis/Src/Encryption', 'Encryption')
  }

  /**
   * Register HTTP server to the IoC container
   *
   * Namespace: Adonis/Src/Server
   * Alias: Server
   */
  private _registerServer () {
    this.$container.singleton('Adonis/Src/Server', (app) => {
      const Route = app.use('Adonis/Src/Route')
      const HttpRequest = app.use('Adonis/Src/Request')
      const HttpResponse = app.use('Adonis/Src/Response')
      const HttpMiddleware = app.use('Adonis/Src/HttpMiddleware')

      const httpConfig = app.use('Adonis/Src/Config').get('app.http', {})
      const appKey = this._getAppKey()
      return new Server(HttpRequest, HttpResponse, Route, HttpMiddleware, httpConfig, appKey)
    })

    this.$container.alias('Adonis/Src/Server', 'Server')
  }

  /**
   * Register body parser middleware to the IoC container
   *
   * Namespace: Adonis/Middleware/BodyParser
   * Alias: NONE
   */
  private _registerBodyParserMiddleware () {
    this.$container.bind('Adonis/Middleware/BodyParser', (app) => {
      const config = app.use('Adonis/Src/Config').get('bodyparser', {})
      return new BodyParserMiddleware(config)
    })
  }

  /**
   * Registers default configs for different parts of the
   * application
   */
  private _registerConfigDefaults () {
    this.$container.with(['Adonis/Src/Config'], (Config) => {
      Config.defaults('app.http', { ...requestConfig, ...responseConfig })
      Config.defaults('app.logger', loggerConfig)
      Config.defaults('bodyparser', bodyParserConfig)
    })
  }

  /**
   * Extends the request class. See [[requestBindings]] function
   * for more info.
   */
  private _extendRequest () {
    this.$container.with(['Adonis/Src/Request'], (Request) => {
      requestBindings(Request)
    })
  }

  /**
   * Perform registrations of providefs
   */
  public register () {
    this._registerEnv()
    this._registerConfig()
    this._registerRoute()
    this._registerRequest()
    this._registerResponse()
    this._registerLogger()
    this._registerServer()
    this._registerHttpMiddleware()
    this._registerBodyParserMiddleware()
    this._registerEncryption()
  }

  /**
   * Hook into boot cycle
   */
  public boot () {
    this._registerConfigDefaults()
    this._extendRequest()
  }
}
