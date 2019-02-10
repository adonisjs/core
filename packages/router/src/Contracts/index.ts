/**
 * @module Http.Router
 */

/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { MacroableConstructorContract } from 'macroable'

/**
 * Shape of route param matchers
 */
export type Matchers = {
  [param: string]: RegExp,
}

/**
 * Route node persisted with the store
 */
export type RouteNode = {
  pattern: string,
  handler: any,
  middleware: any[],
  meta: any,
  name?: string,
}

/**
 * These interfaces are required coz of static methods on the respective
 * classes
 */
interface BriskRouteConstructorContract extends MacroableConstructorContract {
  new (pattern: string, namespace: string, globalMatchers: Matchers): BriskRouteContract
}

interface RouteGroupConstructorContract extends MacroableConstructorContract {
  new (routes: (RouteContract | RouteResourceContract | BriskRouteContract)[]): RouteGroupContract
}

interface RouteResourceConstructorContract extends MacroableConstructorContract {
  new (
    resource: string,
    controller: string,
    namespace: string,
    globalMatchers: Matchers,
    shallow?: boolean,
  ): RouteResourceContract
}

interface RouteConstructorContract extends MacroableConstructorContract {
  new (
    pattern: string,
    methods: string[],
    handler: any,
    namespace: string,
    globalMatchers: Matchers,
  ): RouteContract
}

/**
 * Route defination returned as a result of `route.toJSON` method
 */
export type RouteDefination = RouteNode & { methods: string[], domain?: string, matchers: Matchers }

/**
 * Shape of the matched route for a given
 * url inside a given domain
 */
export type MatchedRoute = {
  route: RouteNode,
  params: any,
  subdomains: any,
}

export interface RouteContract {
  deleted: boolean,
  name: string,
  where (param: string, matcher: string | RegExp): this,
  prefix (prefix: string): this,
  domain (domain: string): this,
  middleware (middleware: any | any[], prepend?: boolean): this,
  as (name: string, append?: boolean): this,
  namespace (namespace: string): this,
  toJSON (): RouteDefination,
}

export interface RouteResourceContract {
  routes: RouteContract[],
  only (names: string[]): this,
  except (names: string[]): this,
  apiOnly (): this,
  middleware (middleware: { [name: string]: any | any[] }): this,
  where (key: string, matcher: string | RegExp): this,
  namespace (namespace: string): this,
}

export interface RouteGroupContract {
  routes: (RouteContract | RouteResourceContract | BriskRouteContract)[],
  where (param: string, matcher: RegExp | string): this,
  prefix (prefix: string): this,
  domain (domain: string): this,
  as (name: string): this,
  middleware (middleware: any | any[]): this,
  namespace (namespace: string): this,
}

export interface RouterContract {
  BriskRoute: BriskRouteConstructorContract,
  RouteGroup: RouteGroupConstructorContract,
  RouteResource: RouteResourceConstructorContract,
  Route: RouteConstructorContract,
  routes: (RouteContract | RouteResourceContract | RouteGroupContract | BriskRouteContract)[],
  route (pattern: string, methods: string[], handler: any): RouteContract,
  any (pattern: string, handler: any): RouteContract,
  get (pattern: string, handler: any): RouteContract,
  post (pattern: string, handler: any): RouteContract,
  put (pattern: string, handler: any): RouteContract,
  patch (pattern: string, handler: any): RouteContract,
  destroy (pattern: string, handler: any): RouteContract,
  group (callback: () => void): RouteGroupContract,
  resource (resource: string, controller: string): RouteResourceContract,
  shallowResource (resource: string, controller: string): RouteResourceContract,
  on (pattern: string): BriskRouteContract,
  where (key: string, matcher: string | RegExp): this,
  namespace (namespace: string): this,
  toJSON (): RouteNode[]
  find (url: string, method: string, domain?: string): null | MatchedRoute,
  urlFor (pattern: string, options: { params?: any, qs?: any }, domain?: string): null | string,
}

export interface BriskRouteContract {
  route: RouteContract | null,
  setHandler (handler: any, invokedBy: string): RouteContract,
}
