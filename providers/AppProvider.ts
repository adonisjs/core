/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DisksList, DriveConfig } from '@ioc:Adonis/Core/Drive'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * The application provider that sticks all core components
 * to the container.
 */
export default class AppProvider {
  constructor(protected app: ApplicationContract) {}
  public static needsApplication = true

  /**
   * Find if web or test environment
   */
  private isWebOrTestEnvironment = ['web', 'test'].includes(this.app.environment)

  /**
   * Additional providers to load
   */
  public provides = [
    '@adonisjs/encryption',
    '@adonisjs/events',
    '@adonisjs/hash',
    '@adonisjs/http-server',
    '@adonisjs/bodyparser',
    '@adonisjs/validator',
  ]

  /**
   * Register `HttpExceptionHandler` to the container.
   */
  protected registerHttpExceptionHandler() {
    this.app.container.bind('Adonis/Core/HttpExceptionHandler', () => {
      const { HttpExceptionHandler } = require('../src/HttpExceptionHandler')
      return HttpExceptionHandler
    })
  }

  /**
   * Registering the health check provider
   */
  protected registerHealthCheck() {
    this.app.container.singleton('Adonis/Core/HealthCheck', () => {
      const { HealthCheck } = require('../src/HealthCheck')
      return new HealthCheck(this.app)
    })
  }

  /**
   * Register drive with the container
   */
  protected registerDrive() {
    this.app.container.singleton('Adonis/Core/Drive', () => {
      const { DriveManager } = require('../src/Drive/DriveManager')
      const Router = this.app.container.resolveBinding('Adonis/Core/Route')
      const Config = this.app.container.resolveBinding('Adonis/Core/Config')

      return new DriveManager(this.app, Router, Config.get('drive', {}))
    })
  }

  /**
   * Register routes for disks using "local" driver.
   */
  protected defineDriveRoutes() {
    this.app.container.withBindings(
      ['Adonis/Core/Config', 'Adonis/Core/Route', 'Adonis/Core/Drive'],
      (Config, Router, Drive) => {
        const driveConfig: DriveConfig = Config.get('drive', {})
        const { LocalFileServer } = require('../src/Drive/LocalFileServer')

        Object.keys(driveConfig.disks).forEach((diskName: keyof DisksList) => {
          const disk = driveConfig.disks[diskName]
          if (disk.driver === 'local' && disk.serveAssets) {
            new LocalFileServer(diskName, disk, Drive.use(diskName), Router).registerRoute()
          }
        })
      }
    )
  }

  /**
   * Registering the assets manager
   */
  protected registerAssetsManager() {
    this.app.container.singleton('Adonis/Core/AssetsManager', () => {
      const { AssetsManager } = require('../src/AssetsManager')
      const config = this.app.container.resolveBinding('Adonis/Core/Config').get('app.assets', {})
      return new AssetsManager(config, this.app)
    })
  }

  /**
   * Lazy initialize the cors hook, if enabled inside the config
   */
  protected registerCorsHook() {
    /**
     * Do not register hooks when not running in web
     * environment
     */
    if (!this.isWebOrTestEnvironment) {
      return
    }

    /**
     * Register the cors before hook with the server
     */
    this.app.container.withBindings(
      ['Adonis/Core/Config', 'Adonis/Core/Server'],
      (Config, Server) => {
        const config = Config.get('cors', {})
        if (!config.enabled) {
          return
        }

        const { Cors } = require('../src/Hooks/Cors')
        const cors = new Cors(config)
        Server.hooks.before(cors.handle.bind(cors))
      }
    )
  }

  /**
   * Lazy initialize the static assets hook, if enabled inside the config
   */
  protected registerStaticAssetsHook() {
    /**
     * Do not register hooks when not running in web
     * environment
     */
    if (!this.isWebOrTestEnvironment) {
      return
    }

    /**
     * Register the cors before hook with the server
     */
    this.app.container.withBindings(
      ['Adonis/Core/Config', 'Adonis/Core/Server', 'Adonis/Core/Application'],
      (Config, Server, Application) => {
        const config = Config.get('static', {})
        if (!config.enabled) {
          return
        }

        const ServeStatic = require('../src/Hooks/Static').ServeStatic
        const serveStatic = new ServeStatic(Application.publicPath(), config)
        Server.hooks.before(serveStatic.handle.bind(serveStatic))
      }
    )
  }

  /**
   * Registers base health checkers
   */
  protected registerHealthCheckers() {
    /**
     * Do not register hooks when not running in web
     * environment
     */
    if (!this.isWebOrTestEnvironment) {
      return
    }

    this.app.container.withBindings(['Adonis/Core/HealthCheck'], (healthCheck) => {
      require('../src/HealthCheck/Checkers/Env').default(healthCheck)
      require('../src/HealthCheck/Checkers/AppKey').default(healthCheck)
    })
  }

  /**
   * Define repl bindings
   */
  protected defineReplBindings() {
    /**
     * Do not register repl bindings when not running in "repl"
     * environment
     */
    if (this.app.environment !== 'repl') {
      return
    }

    /**
     * Define REPL bindings
     */
    this.app.container.withBindings(['Adonis/Addons/Repl'], (Repl) => {
      const { defineReplBindings } = require('../src/Bindings/Repl')
      defineReplBindings(this.app, Repl)
    })
  }

  /**
   * Registering all required bindings to the container
   */
  public register() {
    this.registerHttpExceptionHandler()
    this.registerHealthCheck()
    this.registerAssetsManager()
    this.registerDrive()
  }

  /**
   * Register hooks and health checkers on boot
   */
  public boot() {
    this.registerCorsHook()
    this.registerStaticAssetsHook()
    this.registerHealthCheckers()
    this.defineReplBindings()
    this.defineDriveRoutes()
  }
}
