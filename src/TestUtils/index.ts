/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Macroable } from 'macroable'
import { TestUtilsContract } from '@ioc:Adonis/Core/TestUtils'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { loadAceCommands } from '../utils'
import { TestHttpServer } from './HttpServer'

/**
 * Test utils module is meant to be extended to add custom
 * utilities required for testing AdonisJS applications.
 */
export class TestUtils extends Macroable implements Omit<TestUtilsContract, 'constructor'> {
  public static macros = {}
  public static getters = {}

  constructor(public application: ApplicationContract) {
    super()
  }

  /**
   * Utilities for ace
   */
  public ace() {
    return {
      loadCommands: () => {
        return loadAceCommands(
          this.application,
          this.application.container.resolveBinding('Adonis/Core/Ace')
        )
      },
    }
  }

  /**
   * Utilities for http server
   */
  public httpServer() {
    return new TestHttpServer(this.application)
  }
}
