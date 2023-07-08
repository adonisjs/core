/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Repl } from '../../modules/repl.js'
import { ApplicationService, ContainerBindings } from '../types.js'

/**
 * Resolves a container binding and sets it on the REPL
 * context
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
 * Registers REPL methods
 */
export function defineReplBindings(app: ApplicationService, repl: Repl) {
  repl.addMethod(
    'importDefault',
    (_, modulePath: string) => {
      return app.importDefault(modulePath)
    },
    {
      description: 'Returns the default export for a module',
    }
  )
  repl.addMethod(
    'make',
    (_, service: any, runtimeValues?: any[]) => {
      return app.container.make(service, runtimeValues)
    },
    {
      description: 'Make class instance using "container.make" method',
    }
  )
  repl.addMethod(
    'loadApp',
    () => {
      return resolveBindingForRepl(app, repl, 'app')
    },
    {
      description: 'Load "app" service in the REPL context',
    }
  )
  repl.addMethod(
    'loadEncryption',
    () => {
      return resolveBindingForRepl(app, repl, 'encryption')
    },
    {
      description: 'Load "encryption" service in the REPL context',
    }
  )
  repl.addMethod(
    'loadHash',
    () => {
      return resolveBindingForRepl(app, repl, 'hash')
    },
    {
      description: 'Load "hash" service in the REPL context',
    }
  )
  repl.addMethod(
    'loadRouter',
    () => {
      return resolveBindingForRepl(app, repl, 'router')
    },
    {
      description: 'Load "router" service in the REPL context',
    }
  )
  repl.addMethod(
    'loadConfig',
    () => {
      return resolveBindingForRepl(app, repl, 'config')
    },
    {
      description: 'Load "config" service in the REPL context',
    }
  )
  repl.addMethod(
    'loadTestUtils',
    () => {
      return resolveBindingForRepl(app, repl, 'testUtils')
    },
    {
      description: 'Load "testUtils" service in the REPL context',
    }
  )
  repl.addMethod(
    'loadHelpers',
    async () => {
      const { default: isModule } = await import('../helpers/is.js')
      const { default: stringModule } = await import('../helpers/string.js')
      const { base64, cuid, fsReadAll, slash, parseImports } = await import('../helpers/main.js')
      repl.server!.context.helpers = {
        string: stringModule,
        is: isModule,
        base64,
        cuid,
        fsReadAll,
        slash,
        parseImports,
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
}
