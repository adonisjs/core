/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ContextContract } from '../Context'

type MiddlewareFunctionNode = (ctx: ContextContract) => Promise<void>
type MiddlewareClassNode = {
  new (): {
    handle (ctx: ContextContract): Promise<void>,
  },
}

/**
 * Input for the middleware node
 */
export type MiddlewareNode = MiddlewareFunctionNode | MiddlewareClassNode

export interface MiddlewareContract {
  register (tag: string, middleware: MiddlewareNode[]): this
  registerNamed (tag: string, middleware: { [alias: string]: MiddlewareNode }): this
  get (tag: string): MiddlewareNode[]
  getNamed (tag: string, name: string): null | MiddlewareNode
}
