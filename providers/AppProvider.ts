/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { join } from 'path'
import { IocContract } from '@adonisjs/fold'

import { serverHook } from '../src/Hooks/Cors'
import { HealthCheck } from '../src/HealthCheck'
import { HttpExceptionHandler } from '../src/HttpExceptionHandler'

/**
 * The application provider that sticks all core components
 * to the container.
 */
export default class AppProvider {
  constructor (protected $container: IocContract) {
  }

  public provides = [
    '@adonisjs/env/build/providers/EnvProvider',
    '@adonisjs/config/build/providers/ConfigProvider',
    '@adonisjs/profiler/build/providers/ProfilerProvider',
    '@adonisjs/logger/build/providers/LoggerProvider',
    '@adonisjs/encryption/build/providers/EncryptionProvider',
    '@adonisjs/events/build/providers/EventProvider',
    '@adonisjs/hash/build/providers/HashProvider',
    '@adonisjs/http-server/build/providers/HttpServerProvider',
  ].map((pkg) => require.resolve(pkg, { paths: [join(__dirname, '..')] }))

  /**
   * Register `HttpExceptionHandler` to the container.
   */
  protected $registerHttpExceptionHandler () {
    this.$container.bind('Adonis/Core/HttpExceptionHandler', () => HttpExceptionHandler)
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
   * Registering all required bindings to the container
   */
  public register () {
    this.$registerHttpExceptionHandler()
    this.$registerHealthCheck()
  }

  public boot () {
    /**
     * Register the cors before hook with the server
     */
    this.$container.with(['Adonis/Core/Config', 'Adonis/Core/Server'], (Config, Server) => {
      serverHook(Server, Config.get('cors', {}))
    })
  }
}
