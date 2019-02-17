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
import { Request } from '@adonisjs/request'
import { Response } from '@adonisjs/response'
import { Config } from '../src/Config'
import { Env } from '../src/Env'

export default class AppProvider {
  constructor (public app) {}

  private _registerEnv () {
    this.app.singleton('Adonis/Src/Env', () => {
      const Helpers = this.app.use('Adonis/Src/Helpers')
      return new Env(Helpers.appRoot())
    })
    this.app.alias('Adonis/Src/Env', 'Env')
  }

  private _registerConfig () {
    this.app.singleton('Adonis/Src/Config', () => {
      const Helpers = this.app.use('Adonis/Src/Helpers')
      return new Config(Helpers.configPath())
    })
    this.app.alias('Adonis/Src/Config', 'Config')
  }

  private _registerHttpMiddleware () {
    this.app.singleton('Adonis/Src/HttpMiddleware', () => {
      return new MiddlewareStore()
    })
    this.app.alias('Adonis/Src/HttpMiddleware', 'HttpMiddleware')
  }

  private _registerRoute () {
    this.app.singleton('Adonis/Src/Route', (app) => {
      return new Router((route) => routePreProcessor(route, app.use('Adonis/Src/HttpMiddleware')))
    })
    this.app.alias('Adonis/Src/Route', 'Route')
  }

  private _registerServer () {
    this.app.singleton('Adonis/Src/Server', (app) => {
      const Route = app.use('Adonis/Src/Route')
      const HttpMiddleware = app.use('Adonis/Src/HttpMiddleware')
      const httpConfig = app.use('Adonis/Src/Config').get('app.http', {})
      return new Server(Request, Response, Route, HttpMiddleware, httpConfig)
    })
    this.app.alias('Adonis/Src/Server', 'Server')
  }

  public register () {
    this._registerEnv()
    this._registerConfig()
    this._registerRoute()
    this._registerServer()
    this._registerHttpMiddleware()
  }
}
