/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Shape of route param matchers
 */
export type Matchers = {
  [param: string]: string | RegExp,
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
  toJSON (): RouteDefination,
}

export interface RouteResourceContract {
  routes: RouteContract[],
  only (names: string[]): this,
  except (names: string[]): this,
  apiOnly (): this,
  middleware (middleware: { [name: string]: any | any[] }): this,
  where (key: string, matcher: string | RegExp): this,
}

export interface RouteGroupContract {
  routes: (RouteContract | RouteResourceContract | BriskRouteContract)[],
  where (param: string, matcher: RegExp | string): this,
  prefix (prefix: string): this,
  domain (domain: string): this,
  as (name: string): this,
  middleware (middleware: any | any[]): this,
}

export interface RouterContract {
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
  toJSON (): RouteNode[]
  find (url: string, method: string, domain?: string): null | MatchedRoute,
  urlFor (pattern: string, options: { params?: any, qs?: any }, domain?: string): null | string
}

export interface BriskRouteContract {
  route: RouteContract | null,
  setHandler (handler: any, invokedBy: string): RouteContract,
}
