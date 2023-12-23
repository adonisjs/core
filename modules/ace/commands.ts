/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand as AceBaseCommand, ListCommand as AceListCommand } from '@adonisjs/ace'

import { Kernel } from './kernel.js'
import type { ApplicationService } from '../../src/types.js'
import type { CommandOptions, ParsedOutput, UIPrimitives } from '../../types/ace.js'

/**
 * The base command to create custom ace commands. The AdonisJS base commands
 * receives the application instance
 */
export class BaseCommand extends AceBaseCommand {
  static options: CommandOptions = {}

  get staysAlive() {
    return (this.constructor as typeof BaseCommand).options.staysAlive
  }

  get startApp() {
    return (this.constructor as typeof BaseCommand).options.startApp
  }

  constructor(
    public app: ApplicationService,
    public kernel: Kernel,
    parsed: ParsedOutput,
    ui: UIPrimitives,
    prompt: Kernel['prompt']
  ) {
    super(kernel, parsed, ui, prompt)
  }

  /**
   * Creates the codemods module to modify source files
   */
  async createCodemods() {
    const { Codemods } = await import('./codemods.js')
    const codemods = new Codemods(this.app, this.logger)
    codemods.on('error', () => {
      this.exitCode = 1
    })

    return codemods
  }

  /**
   * The prepare template method is used to prepare the
   * state for the command. This is the first method
   * executed on a given command instance.
   */
  prepare?(..._: any[]): any

  /**
   * The interact template method is used to display the prompts
   * to the user. The method is called after the prepare
   * method.
   */
  interact?(..._: any[]): any

  /**
   * The completed method is the method invoked after the command
   * finishes or results in an error.
   *
   * You can access the command error using the `this.error` property.
   * Returning `true` from completed method supresses the error
   * reporting to the kernel layer.
   */
  completed?(..._: any[]): any

  /**
   * Executes the command
   */
  async exec() {
    this.hydrate()

    try {
      /**
       * Executing the template methods
       */
      this.prepare && (await this.app.container.call<any, 'prepare'>(this, 'prepare'))
      this.interact && (await this.app.container.call<any, 'interact'>(this, 'interact'))
      const result = await this.app.container.call<BaseCommand, 'run'>(this, 'run')

      /**
       * Set exit code
       */
      this.result = this.result === undefined ? result : this.result
      this.exitCode = this.exitCode ?? 0
    } catch (error) {
      this.error = error
      this.exitCode = this.exitCode ?? 1
    }

    /**
     * Run the completed method (if exists) and check if has handled
     * the error
     */
    let errorHandled = this.completed
      ? await this.app.container.call<any, 'completed'>(this, 'completed')
      : false

    if (this.error && !errorHandled) {
      this.logger.fatal(this.error)
    }

    return this.result
  }

  /**
   * Terminate the app. A command should prefer calling this method
   * over the "app.terminate", because this method only triggers
   * app termination when the current command is in the charge
   * of the process.
   */
  async terminate() {
    if (this.kernel.getMainCommand() === this) {
      await this.app.terminate()
    }
  }
}

/**
 * The List command is used to display a list of commands
 */
export class ListCommand extends AceListCommand implements BaseCommand {
  static options: CommandOptions = {}

  get staysAlive() {
    return (this.constructor as typeof BaseCommand).options.staysAlive
  }

  get startApp() {
    return (this.constructor as typeof BaseCommand).options.startApp
  }

  constructor(
    public app: ApplicationService,
    public kernel: Kernel,
    parsed: ParsedOutput,
    ui: UIPrimitives,
    prompt: Kernel['prompt']
  ) {
    super(kernel, parsed, ui, prompt)
  }

  /**
   * Creates the codemods module to modify source files
   */
  async createCodemods() {
    const { Codemods } = await import('./codemods.js')
    return new Codemods(this.app, this.logger)
  }

  /**
   * Terminate the app. A command should prefer calling this method
   * over the "app.terminate", because this method only triggers
   * app termination when the current command is in the charge
   * of the process.
   */
  async terminate() {
    if (this.kernel.getMainCommand() === this) {
      await this.app.terminate()
    }
  }
}
