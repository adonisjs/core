/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

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

  /**
   * Additional providers to load
   */
  public provides = [
    '@adonisjs/env',
    '@adonisjs/config',
    '@adonisjs/profiler/build/providers/ProfilerProvider',
    '@adonisjs/logger',
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
