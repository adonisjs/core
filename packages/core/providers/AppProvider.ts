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

import { Config } from '../src/Config'
import { Env } from '../src/Env'

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
   * Register HTTP server to the IoC container
   *
   * Namespace: Adonis/Src/Server
   * Alias: Server
   */
  private _registerServer () {
    this.app.singleton('Adonis/Src/Server', (app) => {
      const Route = app.use('Adonis/Src/Route')
      const HttpMiddleware = app.use('Adonis/Src/HttpMiddleware')
      const httpConfig = app.use('Adonis/Src/Config').get('app.http', {})
      return new Server(Request, Response, Route, HttpMiddleware, httpConfig)
    })

    this.app.alias('Adonis/Src/Server', 'Server')
  }

  /**
   * Perform registrations of providefs
   */
  public register () {
    this._registerEnv()
    this._registerConfig()
    this._registerRoute()
    this._registerServer()
    this._registerHttpMiddleware()
  }

  /**
   * Hook into boot cycle
   */
  public boot () {
    this.app.with(['Adonis/Src/Config'], (Config) => {
      Config.defaults('app.http', { ...requestConfig, ...responseConfig })
    })
  }
}
