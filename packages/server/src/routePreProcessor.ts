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
import { Exception } from '@adonisjs/utils'

import { ContextContract } from './Contracts'
import { MiddlewareStoreContract } from './Contracts'
import { middlewareExecutor } from './middlewareExecutor'

/**
 * Final handler executes the route handler based on and set
 * the response body on various conditions (check method body)
 * for same.
 */
async function finalHandler (ctx: ContextContract) {
  const handler = ctx.route!.meta.resolvedHandler

  /**
   * Execute handler based upon it's type
   */
  const returnValue = await (
    handler.type === 'class'
      ? global['make'](handler.value)[handler.method](ctx)
      : handler.value(ctx)
    )

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

  /**
   * Resolve route handler before hand to keep HTTP layer performant
   */
  if (typeof (route.handler) === 'string') {
    let handler = route.handler

    /**
     * 1. Do not prepend namespace, if `namespace` starts with `/`.
     * 2. Else if `namespace` exists, then prepend the namespace
     */
    if (route.handler.startsWith('/')) {
      handler = route.handler.substr(1)
    } else if (route.meta.namespace) {
      handler = `${route.meta.namespace.replace(/\/$/, '')}/${route.handler}`
    }

    /**
     * Split the controller and method. Raise error if `method` is missing
     */
    const [ namespace, method ] = handler.split('.')
    if (!method) {
      throw new Exception(`Missing controller method on \`${route.pattern}\` route`)
    }

    route.meta.resolvedHandler = {
      type: 'class',
      value: namespace,
      method,
    }
  } else {
    route.meta.resolvedHandler = {
      type: 'function',
      value: route.handler,
    }
  }

  /**
   * Attach middleware handler when route has 1 or more middleware, otherwise
   * skip the layer and use final handler
   */
  if (route.meta.resolvedMiddleware.length) {
    route.meta.finalHandler = middlewareHandler
  } else {
    route.meta.finalHandler = finalHandler
  }
}
