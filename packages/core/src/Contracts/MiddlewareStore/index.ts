/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export type MiddlewareNode = () => Promise<void>

export interface MiddlewareStoreContract {
  register (middleware: MiddlewareNode[]): this
  registerNamed (middleware: { [alias: string]: MiddlewareNode }): this
  get (): MiddlewareNode[]
  getNamed (name: string): null | MiddlewareNode
}
