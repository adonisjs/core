/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { env } from '@poppinss/env'
import { Config } from '@poppinss/config'
import { Request } from '@poppinss/request'
import { IocContract } from '@adonisjs/fold'
import { Response } from '@poppinss/response'
import { getLogger } from '@poppinss/logger'
import { requireAll } from '@poppinss/utils'
import { ApplicationContract } from '@poppinss/application'
import { Server, HttpContext, MiddlewareStore, Router, routePreProcessor } from '@poppinss/http-server'

import { HttpExceptionHandler } from '../src/HttpExceptionHandler'
import { envLoader } from '../src/envLoader'

/**
 * The application provider that sticks all core components
 * to the container.
 */
export default class AppProvider {
  constructor (protected $container: IocContract) {
  }

  /**
   * Register request and response bindings to the container
   */
  protected $registerRequestResponse () {
    this.$container.bind('Adonis/Src/Request', () => Request)
    this.$container.bind('Adonis/Src/Response', () => Response)
  }

  /**
   * Register config binding to the container
   */
  protected $registerConfigProvider () {
    this.$container.singleton('Adonis/Src/Config', () => {
      const app = this.$container.use<ApplicationContract>('Application')
      return new Config(requireAll(app.configPath()))
    })
  }

  /**
   * Register logger binding to the container
   */
  protected $registerLogger () {
    this.$container.singleton('Adonis/Src/Logger', () => {
      return getLogger(this.$container.use('Adonis/Src/Config').get('app.logger', {}))
    })
  }

  /**
   * Registering the env binding to the container. We also parse the
   * contents of the `.env` and `.env.testing` files.
   */
  protected $registerEnv () {
    this.$container.singleton('Adonis/Src/Env', () => {
      const app = this.$container.use<ApplicationContract>('Application')
      const { envContents, testEnvContent } = envLoader(app.appRoot)

      env.process(envContents, false)
      env.process(testEnvContent, true)

      return env
    })
  }

  /**
   * Registering middleware store to the container
   */
  protected $registerMiddlewareStore () {
    this.$container.singleton('Adonis/Src/MiddlewareStore', () => new MiddlewareStore())
  }

  /**
   * Registering router to the container.
   */
  protected $registerRouter () {
    this.$container.singleton('Adonis/Src/Route', () => {
      const middlewareStore = this.$container.use('Adonis/Src/MiddlewareStore')
      return new Router((route) => routePreProcessor(route, middlewareStore))
    })
  }

  /**
   * Binding http server to the container
   */
  protected $registerHttpServer () {
    this.$container.bind('Adonis/Src/HttpContext', () => HttpContext)

    this.$container.singleton('Adonis/Src/Server', () => {
      const Config = this.$container.use('Adonis/Src/Config')
      const httpConfig = Config.get('app.http', {})
      const secret = Config.get('app.appKey')

      return new Server(
        HttpContext,
        this.$container.use('Adonis/Src/Route'),
        this.$container.use('Adonis/Src/MiddlewareStore'),
        this.$container.use('Adonis/Src/Logger'),
        Object.assign({ secret }, httpConfig),
      )
    })
  }

  /**
   * Register `HttpExceptionHandler` to the container.
   */
  protected $registerHttpExceptionHandler () {
    this.$container.bind('Adonis/Src/HttpExceptionHandler', () => HttpExceptionHandler)
  }

  /**
   * Registering all required bindings to the container
   */
  public register () {
    this.$registerEnv()
    this.$registerConfigProvider()
    this.$registerLogger()
    this.$registerRequestResponse()
    this.$registerRouter()
    this.$registerMiddlewareStore()
    this.$registerHttpServer()
    this.$registerHttpExceptionHandler()
  }
}
