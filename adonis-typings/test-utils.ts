/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/TestUtils' {
  import type { Server as HttpsServer } from 'https'
  import type { MacroableConstructorContract } from 'macroable'
  import type { IncomingMessage, ServerResponse, Server } from 'http'

  export type ServerHandler = (req: IncomingMessage, res: ServerResponse) => any
  export type CustomServerCallback = (handler: ServerHandler) => Server | HttpsServer

  export interface TestUtilsContract {
    constructor: MacroableConstructorContract<TestUtilsContract>
    ace(): {
      loadCommands(): Promise<void>
    }
    httpServer(): {
      start(serverCallback?: CustomServerCallback): Promise<() => Promise<void>>
    }
  }

  /**
   * Test utils module is meant to be extended to add custom
   * utilities required for testing AdonisJS applications.
   */
  const TestUtils: TestUtilsContract
  export default TestUtils
}
