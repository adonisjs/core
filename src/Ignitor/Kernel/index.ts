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

import { registerTsHook } from '../../utils'
import { SignalsListener } from '../SignalsListener'

/**
 * Kernel to manage application state
 */
export class AppKernel {
  /**
   * Reference to application instance
   */
  public application: Application

  /**
   * Reference to signals listener
   */
  public signalsListener: SignalsListener

  /**
   * Find if the application has been booted or not
   */
  public hasBooted = false

  /**
   * Avoiding duplicate registeration of ts compiler hook
   */
  private hasRegisteredTsHook = false

  constructor(appRoot: string, environment: AppEnvironments) {
    this.application = new Application(appRoot, environment)
    this.signalsListener = new SignalsListener(this.application)
  }

  /**
   * Pretty prints a given error on the terminal
   */
  private async prettyPrintError(error: any) {
    try {
      const Youch = require('youch')
      const output = await new Youch(error, {}).toJSON()
      console.log(require('youch-terminal')(output))
    } catch {
      console.log(error.stack)
    }
  }

  /**
   * Boot the application. The process for booting the app remains the
   * same regardless of the process environment.
   */
  public async boot() {
    if (this.hasBooted) {
      return
    }

    /**
     * Setting up the application.
     */
    await this.application.setup()

    /**
     * Registering providers
     */
    await this.application.registerProviders()

    /**
     * Booting providers
     */
    await this.application.bootProviders()

    /**
     * Importing preloaded files
     */
    await this.application.requirePreloads()

    this.hasBooted = true
  }

  /**
   * Registers the TS compiler to hook into node require and
   * process TypeScript files
   */
  public registerTsCompilerHook() {
    /**
     * Register ts hook when running typescript code directly
     */
    if (this.application.rcFile.typescript && !this.hasRegisteredTsHook) {
      this.hasRegisteredTsHook = true
      registerTsHook(this.application.appRoot)
    }
  }

  /**
   * Start the application. The callback is required to listen
   * for close signals
   */
  public async start(shutdownCallback?: () => Promise<void>) {
    await this.application.start()
    this.signalsListener.listen(shutdownCallback || (() => this.close()))
    return () => this.close()
  }

  /**
   * Notify that process is ready
   */
  public ready(eventPayload: Record<string, any>) {
    if (process.send) {
      process.send('ready')
      process.send({ isAdonisJS: true, environment: this.application.environment, ...eventPayload })
    }
  }

  /**
   * Prepare application for shutdown
   */
  public async close() {
    this.signalsListener.cleanup()
    await this.application.shutdown()
  }

  /**
   * Handles ignitor boot errors
   */
  public async handleError(error: any) {
    if (typeof error.handle === 'function') {
      await error.handle(error)
    } else if (this.application.inDev) {
      await this.prettyPrintError(error)
    } else {
      console.error(error.stack)
    }
  }
}
