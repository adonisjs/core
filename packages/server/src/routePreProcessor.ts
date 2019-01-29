/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RouteNode } from '@adonisjs/router'
import { Middleware } from 'co-compose'
import { ContextContract } from './Contracts'
import { MiddlewareStoreContract } from './Contracts'
import { middlewareExecutor } from './middlewareExecutor'

/**
 * Final handler executes the route handler based on and set
 * the response body on various conditions (check method body)
 * for same.
 */
async function finalHandler (ctx: ContextContract) {
  const returnValue = await ctx.route!.handler(ctx)

  if (
    returnValue !== undefined &&            // Return value is explicitly defined
    returnValue !== ctx.response &&         // Return value is not the instance of response object
    ctx.response.explicitEnd &&             // Explicit end is set to true
    !ctx.response.hasLazyBody               // Lazy body is not set
  ) {
    ctx.response.send(returnValue)
  }
}

/**
 * Executes the route middleware
 */
async function middlewareHandler (ctx: ContextContract) {
  await new Middleware()
    .register(ctx.route!.meta.resolvedMiddleware)
    .runner()
    .finalHandler(finalHandler, [ctx])
    .resolve(middlewareExecutor)
    .run([ctx])
}

/**
 * Hooks into route registration lifecycle and attaches finalHandler to
 * execute the route middleware and final handler.
 *
 * We pre-compile routes and final handler to a single function, which improves
 * the performance by reducing the overhead of processing middleware on each
 * request
 */
export function routePreProcessor (route: RouteNode, middlewareStore: MiddlewareStoreContract) {
  middlewareStore.routeMiddlewareProcessor(route)
  route.meta.finalHandler = middlewareHandler
}
