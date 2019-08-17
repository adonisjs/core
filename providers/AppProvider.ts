/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { env } from '@poppinss/env'
import { Hash } from '@poppinss/hash'
import { Logger } from '@poppinss/logger'
import { Config } from '@poppinss/config'
import { Emitter } from '@poppinss/events'
import { Request } from '@poppinss/request'
import { requireAll } from '@poppinss/utils'
import { IocContract } from '@adonisjs/fold'
import { Response } from '@poppinss/response'
import { ApplicationContract } from '@poppinss/application'
import { Profiler } from '@poppinss/profiler'
import { Server, HttpContext, MiddlewareStore, Router, routePreProcessor } from '@poppinss/http-server'

import { envLoader } from '../src/envLoader'
import { Cors } from '../src/Middleware/Cors'
import { Encryption } from '../src/Encryption'
import extendRouter from '../src/Bindings/Route'
import { HealthCheck } from '../src/HealthCheck'
import extendRequest from '../src/Bindings/Request'
import { RequestLogger } from '../src/HttpHooks/RequestLogger'
import { HttpExceptionHandler } from '../src/HttpExceptionHandler'

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
    this.$container.bind('Adonis/Core/Request', () => Request)
    this.$container.bind('Adonis/Core/Response', () => Response)
  }

  /**
   * Register config binding to the container
   */
  protected $registerConfigProvider () {
    this.$container.singleton('Adonis/Core/Config', () => {
      const app = this.$container.use<ApplicationContract>('Adonis/Core/Application')
      return new Config(requireAll(app.configPath()))
    })
  }

  /**
   * Register logger binding to the container
   */
  protected $registerLogger () {
    this.$container.singleton('Adonis/Core/Logger', () => {
      return new Logger(this.$container.use('Adonis/Core/Config').get('app.logger', {}))
    })
  }

  /**
   * Register profiler under `Adonis/Core/Profiler` namespace
   */
  protected $registerProfiler () {
    this.$container.singleton('Adonis/Core/Profiler', () => {
      const Config = this.$container.use('Adonis/Core/Config')
      return new Profiler(Config.get('app.profiler', {}))
    })
  }

  /**
   * Registering the env binding to the container. We also parse the
   * contents of the `.env` and `.env.testing` files.
   */
  protected $registerEnv () {
    this.$container.singleton('Adonis/Core/Env', () => {
      const app = this.$container.use<ApplicationContract>('Adonis/Core/Application')
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
    this.$container.singleton('Adonis/Core/MiddlewareStore', () => new MiddlewareStore())
  }

  /**
   * Registering router to the container.
   */
  protected $registerRouter () {
    this.$container.singleton('Adonis/Core/Route', () => {
      const middlewareStore = this.$container.use('Adonis/Core/MiddlewareStore')
      return new Router((route) => routePreProcessor(route, middlewareStore))
    })
  }

  /**
   * Binding http server to the container
   */
  protected $registerHttpServer () {
    this.$container.bind('Adonis/Core/HttpContext', () => HttpContext)

    this.$container.singleton('Adonis/Core/Server', () => {
      const Config = this.$container.use('Adonis/Core/Config')
      const httpConfig = Config.get('app.http', {})
      const secret = Config.get('app.appKey')

      return new Server(
        HttpContext,
        this.$container.use('Adonis/Core/Route'),
        this.$container.use('Adonis/Core/MiddlewareStore'),
        this.$container.use('Adonis/Core/Logger'),
        this.$container.use('Adonis/Core/Profiler'),
        Object.assign({ secret }, httpConfig),
      )
    })
  }

  /**
   * Register `HttpExceptionHandler` to the container.
   */
  protected $registerHttpExceptionHandler () {
    this.$container.bind('Adonis/Core/HttpExceptionHandler', () => HttpExceptionHandler)
  }

  /**
   * Register `Event emitter` to the container.
   */
  protected $registerEmitter () {
    this.$container.singleton('Adonis/Core/Event', () => {
      return new Emitter()
    })
  }

  /**
   * Registers `cors` middleware to the container
   */
  protected $registerCorsMiddleware () {
    this.$container.singleton('Adonis/Core/CorsMiddleware', () => {
      const config = this.$container.use('Adonis/Core/Config').get('cors', {})
      return new Cors(config)
    })
  }

  /**
   * Registering the hash provider
   */
  protected $registerHash () {
    this.$container.singleton('Adonis/Core/Hash', () => {
      const config = this.$container.use('Adonis/Core/Config').get('hash', {})
      return new Hash(this.$container, config)
    })
  }

  /**
   * Registering the health check provider
   */
  protected $registerHealthCheck () {
    this.$container.singleton('Adonis/Core/HealthCheck', () => {
      return new HealthCheck(this.$container.use('Adonis/Core/Application'))
    })
  }

  /**
   * Registering the health check provider
   */
  protected $registerEncryption () {
    this.$container.singleton('Adonis/Core/Encryption', () => {
      const Config = this.$container.use('Adonis/Core/Config')
      return new Encryption(Config.get('app.appKey'))
    })
  }

  /**
   * Registering all required bindings to the container
   */
  public register () {
    this.$registerEnv()
    this.$registerConfigProvider()
    this.$registerLogger()
    this.$registerProfiler()
    this.$registerRequestResponse()
    this.$registerRouter()
    this.$registerMiddlewareStore()
    this.$registerHttpServer()
    this.$registerHttpExceptionHandler()
    this.$registerEmitter()
    this.$registerCorsMiddleware()
    this.$registerHash()
    this.$registerEncryption()
    this.$registerHealthCheck()
  }

  public boot () {
    const logRequests = this.$container.use('Adonis/Core/Config').get('app.http.logRequests', false)
    if (!logRequests) {
      return
    }

    /**
     * Create a single instance of the logger and hook it as a `before` server hook.
     */
    this.$container.with(['Adonis/Core/Server'], (Server) => {
      const requestLogData = this.$container.use('Adonis/Core/Config').get('app.http.requestLogData')
      const logger = new RequestLogger({ logRequests, requestLogData })
      Server.before(logger.onRequest.bind(logger))
    })

    /**
     * Extending request class
     */
    this.$container.with(['Adonis/Core/Request', 'Adonis/Core/Encryption'], (Request, Encryption) => {
      extendRequest(Request, Encryption)
    })

    /**
     * Extending router class
     */
    this.$container.with(['Adonis/Core/Route', 'Adonis/Core/Encryption'], (Route, Encryption) => {
      extendRouter(Route, Encryption)
    })
  }
}
