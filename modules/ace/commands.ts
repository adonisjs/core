/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import { BaseCommand as AceBaseCommand, ListCommand as AceListCommand } from '@adonisjs/ace'

import { Kernel } from './kernel.js'
import type { ApplicationService } from '../../src/types.js'
import type { CommandOptions, ParsedOutput, UIPrimitives } from '../../types/ace.js'

/**
 * Wrapper around the stub generation logic.
 * Allow commands to easily generate files from given stubs
 */
class StubGenerator {
  #command: BaseCommand | ListCommand
  #flags: Record<string, any>

  constructor(command: BaseCommand, flags: Record<string, any>) {
    this.#command = command
    this.#flags = flags
  }

  async generate(stubsRoot: string, stubPath: string, stubState: Record<string, any>) {
    const stub = await this.#command.app.stubs.build(stubPath, { source: stubsRoot })
    const output = await stub.generate(Object.assign({ flags: this.#flags }, stubState))

    const entityFileName = slash(this.#command.app.relativePath(output.destination))
    const result = { ...output, relativeFileName: entityFileName }

    if (output.status === 'skipped') {
      this.#command.logger.action(`create ${entityFileName}`).skipped(output.skipReason)
      return result
    }

    this.#command.logger.action(`create ${entityFileName}`).succeeded()
    return result
  }
}

/**
 * The base command to create custom ace commands. The AdonisJS base commands
 * receives the application instance
 */
export class BaseCommand extends AceBaseCommand {
  stubGenerator: StubGenerator = new StubGenerator(this, this.parsed?.flags || {})

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
   * Make a new file using the given stub
   */
  async makeUsingStub(stubPath: string, stubState: Record<string, any>, stubsRoot: string) {
    return this.stubGenerator.generate(stubsRoot, stubPath, stubState)
  }

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
  stubGenerator: StubGenerator = new StubGenerator(this, this.parsed?.flags || {})
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
   * Make a new file using the given stub
   */
  async makeUsingStub(stubPath: string, stubState: Record<string, any>, stubsRoot: string) {
    return this.stubGenerator.generate(stubsRoot, stubPath, stubState)
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
