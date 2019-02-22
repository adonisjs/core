/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Router } from '@adonisjs/router'
import { Server, MiddlewareStore, routePreProcessor } from '@adonisjs/server'
import { Request, requestConfig } from '@adonisjs/request'
import { Response, responseConfig } from '@adonisjs/response'
import { IocContract } from '@adonisjs/fold'
import { BodyParserMiddleware, bodyParserConfig } from '@adonisjs/bodyparser'

import { Config } from '../src/Config'
import { Env } from '../src/Env'
import { Logger } from '../src/Logger'
import { loggerConfig } from '../config/logger'

export default class AppProvider {
  constructor (public app: IocContract) {}

  /**
   * Registers the env provider to the IoC container.
   *
   * Namespace: Adonis/Src/Env
   * Alias: Env
   */
  private _registerEnv () {
    this.app.singleton('Adonis/Src/Env', () => {
      const Helpers = this.app.use('Adonis/Src/Helpers')
      return new Env(Helpers.appRoot())
    })

    this.app.alias('Adonis/Src/Env', 'Env')
  }

  /**
   * Register config provider to the IoC container.
   *
   * Namespace: Adonis/Src/Config
   * Alias: Config
   */
  private _registerConfig () {
    this.app.singleton('Adonis/Src/Config', () => {
      const Helpers = this.app.use('Adonis/Src/Helpers')
      return new Config(Helpers.configPath())
    })

    this.app.alias('Adonis/Src/Config', 'Config')
  }

  /**
   * Register Http middleware store to the IoC container
   *
   * Namespace: Adonis/Src/HttpMiddleware
   * Alias: HttpMiddleware
   */
  private _registerHttpMiddleware () {
    this.app.singleton('Adonis/Src/HttpMiddleware', () => {
      return new MiddlewareStore()
    })

    this.app.alias('Adonis/Src/HttpMiddleware', 'HttpMiddleware')
  }

  /**
   * Registers Request class to the IoC container
   *
   * Namespace: Adonis/Src/Request
   * Alias: NONE
   */
  private _registerRequest () {
    this.app.singleton('Adonis/Src/Request', () => {
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
    this.app.singleton('Adonis/Src/Response', () => {
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
    this.app.singleton('Adonis/Src/Route', (app) => {
      return new Router((route) => routePreProcessor(route, app.use('Adonis/Src/HttpMiddleware')))
    })

    this.app.alias('Adonis/Src/Route', 'Route')
  }

  /**
   * Register logger provider to the IoC container.
   *
   * Namespace: Adonis/Src/Logger
   * Alias: Logger
   */
  private _registerLogger () {
    this.app.singleton('Adonis/Src/Logger', (app) => {
      const loggerConfig = app.use('Adonis/Src/Config').get('app.logger', {})
      return new Logger(loggerConfig)
    })

    this.app.alias('Adonis/Src/Logger', 'Logger')
  }

  /**
   * Register HTTP server to the IoC container
   *
   * Namespace: Adonis/Src/Server
   * Alias: Server
   */
  private _registerServer () {
    this.app.singleton('Adonis/Src/Server', (app) => {
      const Route = app.use('Adonis/Src/Route')
      const HttpRequest = app.use('Adonis/Src/Request')
      const HttpResponse = app.use('Adonis/Src/Response')
      const HttpMiddleware = app.use('Adonis/Src/HttpMiddleware')

      const httpConfig = app.use('Adonis/Src/Config').get('app.http', {})
      return new Server(HttpRequest, HttpResponse, Route, HttpMiddleware, httpConfig)
    })

    this.app.alias('Adonis/Src/Server', 'Server')
  }

  /**
   * Register body parser middleware to the IoC container
   *
   * Namespace: Adonis/Middleware/BodyParser
   * Alias: NONE
   */
  private _registerBodyParserMiddleware () {
    this.app.bind('Adonis/Middleware/BodyParser', (app) => {
      const config = app.use('Adonis/Src/Config').get('bodyparser', {})
      return new BodyParserMiddleware(config)
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
  }

  /**
   * Hook into boot cycle
   */
  public boot () {
    this.app.with(['Adonis/Src/Config'], (Config) => {
      Config.defaults('app.http', { ...requestConfig, ...responseConfig })
      Config.defaults('app.logger', loggerConfig)
      Config.defaults('bodyparser', bodyParserConfig)
    })
  }
}
