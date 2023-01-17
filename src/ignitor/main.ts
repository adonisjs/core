/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { HttpServerProcess } from './http.js'
import { setApp } from '../../services/app.js'
import { Application } from '../../modules/app.js'
import type { ApplicationService } from '../types.js'
import debug from '../debug.js'

/**
 * Ignitor is used to instantiate an AdonisJS application in different
 * known environments.
 */
export class Ignitor {
  /**
   * Application root URL
   */
  #appRoot: URL

  /**
   * Reference to the created application
   */
  #tapCallbacks: Set<(app: ApplicationService) => void> = new Set()

  constructor(appRoot: URL) {
    this.#appRoot = appRoot
  }

  /**
   * Tap to access the application class instance.
   */
  tap(callback: (app: ApplicationService) => void): this {
    this.#tapCallbacks.add(callback)
    return this
  }

  /**
   * Get instance of the HTTP server. Calling this method create an in
   * the web environment and runs the tap callbacks.
   */
  httpServer() {
    debug('creating application instance')
    const application: ApplicationService = new Application(this.#appRoot, {
      environment: 'web',
    })
    setApp(application)

    this.#tapCallbacks.forEach((callback) => callback(application))
    this.#tapCallbacks.clear()

    return new HttpServerProcess(application)
  }
}
