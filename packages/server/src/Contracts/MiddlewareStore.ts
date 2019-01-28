/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Input middleware node must be function or a string pointing
 * to the IoC container
 */
export type MiddlewareNode = ((ctx: any, next: () => Promise<void>) => Promise<void>) | string

/**
 * Shape of resolved middleware. This information is
 * enough to execute the middleware
 */
export type ResolvedMiddlewareNode = {
  type: string,
  value: any,
  args: string[],
}

export interface MiddlewareStoreContract {
  register (middleware: MiddlewareNode[]): this,
  registerNamed (middleware: { [alias: string]: MiddlewareNode }): this,
  get (): ResolvedMiddlewareNode[],
  getNamed (name: string): null | ResolvedMiddlewareNode,
  routeMiddlewareProcessor (route: any): void,
  middlewareExecutor (middleware: ResolvedMiddlewareNode, params: any[]): Promise<void>
}
