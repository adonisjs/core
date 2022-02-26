/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import { Application } from '@adonisjs/application'
import { AppEnvironments } from '@ioc:Adonis/Core/Application'

import { Ace } from './Ace'
import { HttpServer } from './HttpServer'
import { AppKernel } from './Kernel'

/**
 * Ignitor is used to wireup different pieces of AdonisJs to bootstrap
 * the application.
 */
export class Ignitor {
  private appRoot: string

  constructor(appRoot: string) {
    /**
     * In ESM, ignitor is constructed with `import.meta.url`. Normalize
     * the file URL to an absolute directory path.
     */
    this.appRoot = appRoot.startsWith('file:') ? dirname(fileURLToPath(appRoot)) : appRoot
  }

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
   * Returns instance of server to start
   * the HTTP server
   */
  public kernel(environment: AppEnvironments) {
    return new AppKernel(this.appRoot, environment)
  }

  /**
   * Returns instance of ace to handle console
   * commands
   */
  public ace() {
    return new Ace(this.appRoot)
  }
}
