/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { fileURLToPath } from 'node:url'
import { getGitWorktree, type GitWorktree } from '@poppinss/utils'
import { BaseCommand as AceBaseCommand, ListCommand as AceListCommand } from '@adonisjs/ace'

import { type Kernel } from './kernel.ts'
import type { ApplicationService } from '../../src/types.ts'
import type { CommandOptions, ParsedOutput, UIPrimitives } from '../../types/ace.ts'
import { getBasePort, computeWorktreePort } from '../../src/helpers/worktree.ts'

/**
 * The base command class for creating custom Ace commands in AdonisJS applications.
 * This class extends the base Ace command with AdonisJS-specific functionality like
 * dependency injection and application lifecycle management.
 *
 * @example
 * ```ts
 * export default class MakeUser extends BaseCommand {
 *   static commandName = 'make:user'
 *   static description = 'Create a new user'
 *
 *   async run() {
 *     this.logger.info('Creating user...')
 *     // Command implementation
 *   }
 * }
 * ```
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
   * Creates the codemods module to modify source files programmatically.
   * This method provides access to AST-based code transformations.
   *
   * @example
   * ```ts
   * const codemods = await this.createCodemods()
   * await codemods.makeUsingStub(stubsRoot, 'controller.stub', {
   *   filename: 'UserController',
   *   entity: { name: 'User' }
   * })
   * ```
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
   * Returns the linked git worktree in which the application is running,
   * alongside a deterministic port computed from the worktree name. Returns
   * "null" when the application is not running inside a linked git worktree
   * (for example the main checkout or a non-git directory).
   *
   * The port is stable for a given worktree name and base port, so multiple
   * worktrees of the same application can run in parallel without port
   * conflicts. The base port is read from the application dot-env files
   * (via the "PORT" variable), with 3333 as the fallback.
   *
   * @example
   * ```ts
   * const worktreePort = await this.getWorktreePort()
   * if (worktreePort) {
   *   console.log(worktreePort.worktree.name)
   *   console.log(worktreePort.port)
   * }
   * ```
   */
  async getWorktreePort(): Promise<{ worktree: GitWorktree; port: number } | null> {
    const worktree = await getGitWorktree(fileURLToPath(this.app.appRoot))
    if (!worktree) {
      return null
    }

    const basePort = await getBasePort(this.app.appRoot)
    return { worktree, port: computeWorktreePort(worktree.name, basePort) }
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
   * Executes the lifecycle hooks and the run method from the command
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
      await this.kernel.errorHandler.render(this.error, this.kernel)
    }

    return this.result
  }

  /**
   * Terminate the application gracefully. This method should be preferred over
   * calling `app.terminate()` directly as it only triggers termination when
   * the current command is the main command responsible for the process.
   *
   * @example
   * ```ts
   * export default class SomeCommand extends BaseCommand {
   *   async run() {
   *     // Do some work
   *     await this.terminate()
   *   }
   * }
   * ```
   */
  async terminate() {
    if (this.kernel.getMainCommand() === this) {
      await this.app.terminate()
    }
  }
}

/**
 * The List command is used to display a list of available commands.
 * This command extends the base Ace ListCommand with AdonisJS-specific functionality.
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
   * Auto-select JSON output when running inside an AI agent
   * and no explicit format flag is provided.
   */
  async run() {
    if (!this.json && this.app.runningInAIAgent) {
      this.json = true
    }
    return super.run()
  }

  /**
   * Creates the codemods module to modify source files programmatically.
   * This method provides access to AST-based code transformations.
   */
  async createCodemods() {
    const { Codemods } = await import('./codemods.js')
    return new Codemods(this.app, this.logger)
  }

  /**
   * Returns the linked git worktree in which the application is running,
   * alongside a deterministic port computed from the worktree name. Returns
   * "null" when the application is not running inside a linked git worktree.
   */
  async getWorktreePort(): Promise<{ worktree: GitWorktree; port: number } | null> {
    const worktree = await getGitWorktree(fileURLToPath(this.app.appRoot))
    if (!worktree) {
      return null
    }

    const basePort = await getBasePort(this.app.appRoot)
    return { worktree, port: computeWorktreePort(worktree.name, basePort) }
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
