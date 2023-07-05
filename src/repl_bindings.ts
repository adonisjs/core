/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationService } from '@adonisjs/core/types'
import { Repl } from '@adonisjs/repl'

/**
 * Add a new value to the REPL context
 */
function setupReplContext(repl: any, key: string, value: any) {
  repl.server.context[key] = value
  repl.notify(
    `Loaded ${key} module. You can access it using the "${repl.colors.underline(key)}" variable`
  )
}

/**
 * Define REPL bindings for core modules
 */
export function defineReplBindings({ container }: ApplicationService, replService: Repl) {
  /**
   * Load the encryption module
   */
  replService.addMethod(
    'loadEncryption',
    async (repl) => setupReplContext(repl, 'encryption', await container.make('encryption')),
    { description: 'Load encryption provider and save reference to the "encryption" variable' }
  )

  /**
   * Load the hash module
   */
  replService.addMethod(
    'loadHash',
    async (repl) => setupReplContext(repl, 'hash', await container.make('hash')),
    { description: 'Load hash provider and save reference to the "hash" variable' }
  )

  /**
   * Load the HTTP router
   */
  replService.addMethod(
    'loadRouter',
    async (repl) => setupReplContext(repl, 'router', await container.make('router')),
    { description: 'Load router and save reference to the "router" variable' }
  )

  /**
   * Load config
   */
  replService.addMethod(
    'loadConfig',
    async (repl) => setupReplContext(repl, 'config', await container.make('config')),
    { description: 'Load config and save reference to the "config" variable' }
  )
}
