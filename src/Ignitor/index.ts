/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Application } from '@adonisjs/application'
import { AppEnvironments } from '@ioc:Adonis/Core/Application'

import { Ace } from './Ace'
import { HttpServer } from './HttpServer'

/**
 * Ignitor is used to wireup different pieces of AdonisJs to bootstrap
 * the application.
 */
export class Ignitor {
  constructor(private appRoot: string) {}

  /**
   * Returns an instance of the application.
   */
  public application(environment: AppEnvironments) {
    return new Application(this.appRoot, environment)
  }

  /**
   * Returns instance of server to start
   * the HTTP server
   */
  public httpServer() {
    return new HttpServer(this.appRoot)
  }

  /**
   * Returns instance of ace to handle console
   * commands
   */
  public ace() {
    return new Ace(this.appRoot)
  }
}
