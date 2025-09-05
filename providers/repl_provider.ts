/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { homedir } from 'node:os'
import { fsImportAll } from '@poppinss/utils/fs'

import { Repl } from '../modules/repl.ts'
import type { ApplicationService, ContainerBindings } from '../src/types.ts'

/**
 * Resolves a container binding and sets it on the REPL
 * context
 *
 * This helper function makes a service from the container and
 * adds it to the REPL context with a notification message.
 *
 * @param app - The application service instance
 * @param repl - The REPL instance to add the binding to
 * @param binding - The container binding key to resolve
 *
 * @example
 * await resolveBindingForRepl(app, repl, 'router')
 * // Now 'router' variable is available in REPL
 */
async function resolveBindingForRepl(
  app: ApplicationService,
  repl: Repl,
  binding: keyof ContainerBindings
) {
  repl.server!.context[binding] = await app.container.make(binding)
  repl.notify(
    `Loaded "${binding}" service. You can access it using the "${repl.colors.underline(
      binding
    )}" variable`
  )
}

/**
 * REPL Service Provider configures the interactive Node.js REPL
 * for AdonisJS applications
 *
 * This provider sets up:
 * - REPL instance with history file support
 * - Helper methods for importing modules and making container bindings
 * - Quick access methods for loading common services (app, router, etc.)
 * - Utility methods for development and debugging
 *
 * @example
 * const provider = new ReplServiceProvider(app)
 * provider.register()
 * await provider.boot()
 */
export default class ReplServiceProvider {
  /**
   * REPL service provider constructor
   *
   * @param app - The application service instance
   */
  constructor(protected app: ApplicationService) {}

  /**
   * Registers the REPL binding
   *
   * Creates a singleton binding for the REPL with history file
   * support in the user's home directory.
   *
   * @example
   * const provider = new ReplServiceProvider(app)
   * provider.register()
   * const repl = await app.container.make('repl')
   */
  register() {
    this.app.container.singleton(Repl, async () => {
      return new Repl({
        historyFilePath: join(homedir(), '.adonisjs_v6_repl_history'),
      })
    })
    this.app.container.alias('repl', Repl)
  }

  /**
   * Registering REPL bindings during provider boot
   *
   * Adds helper methods to the REPL instance including:
   * - importDefault: Import default export from modules
   * - importAll: Import all files from a directory
   * - make: Create instances using container.make
   * - load* methods: Quick access to common services
   * - loadHelpers: Load utility helper functions
   *
   * @example
   * await provider.boot()
   * // REPL now has helper methods available
   */
  async boot() {
    this.app.container.resolving('repl', (repl) => {
      repl.addMethod(
        'importDefault',
        (_, modulePath: string) => {
          return this.app.importDefault(modulePath)
        },
        {
          description: 'Returns the default export for a module',
        }
      )

      repl.addMethod(
        'importAll',
        (_, dirPath: string) => {
          return fsImportAll(this.app.makeURL(dirPath), {
            ignoreMissingRoot: false,
          })
        },
        {
          description: 'Import all files from a directory and assign them to a variable',
        }
      )

      repl.addMethod(
        'make',
        (_, service: any, runtimeValues?: any[]) => {
          return this.app.container.make(service, runtimeValues)
        },
        {
          description: 'Make class instance using "container.make" method',
        }
      )

      repl.addMethod(
        'loadApp',
        () => {
          return resolveBindingForRepl(this.app, repl, 'app')
        },
        {
          description: 'Load "app" service in the REPL context',
        }
      )

      repl.addMethod(
        'loadEncryption',
        () => {
          return resolveBindingForRepl(this.app, repl, 'encryption')
        },
        {
          description: 'Load "encryption" service in the REPL context',
        }
      )

      repl.addMethod(
        'loadHash',
        () => {
          return resolveBindingForRepl(this.app, repl, 'hash')
        },
        {
          description: 'Load "hash" service in the REPL context',
        }
      )

      repl.addMethod(
        'loadRouter',
        () => {
          return resolveBindingForRepl(this.app, repl, 'router')
        },
        {
          description: 'Load "router" service in the REPL context',
        }
      )

      repl.addMethod(
        'loadConfig',
        () => {
          return resolveBindingForRepl(this.app, repl, 'config')
        },
        {
          description: 'Load "config" service in the REPL context',
        }
      )

      repl.addMethod(
        'loadTestUtils',
        () => {
          return resolveBindingForRepl(this.app, repl, 'testUtils')
        },
        {
          description: 'Load "testUtils" service in the REPL context',
        }
      )

      repl.addMethod(
        'loadHelpers',
        async () => {
          const { default: isModule } = await import('../src/helpers/is.js')
          const { default: stringModule } = await import('../src/helpers/string.js')
          const helpers = await import('../src/helpers/main.js')
          repl.server!.context.helpers = {
            string: stringModule,
            is: isModule,
            ...helpers,
          }

          repl.notify(
            `Loaded "helpers" module. You can access it using the "${repl.colors.underline(
              'helpers'
            )}" variable`
          )
        },
        {
          description: 'Load "helpers" module in the REPL context',
        }
      )
    })
  }
}
