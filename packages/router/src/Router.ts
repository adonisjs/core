/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stringify } from 'querystring'
import { Route } from './Route'
import { RouteResource } from './Resource'
import { RouteGroup } from './Group'
import { BriskRoute } from './BriskRoute'
import { Matchers } from './Contracts'
import { Store } from './Store'
import { toRoutesJSON } from '../lib'
import { RouteNode, RouterContract, MatchedRoute } from './Contracts'

type LookupNode = {
  handler: any,
  pattern: string,
  domain: string,
  name?: string,
}

/**
 * Router class exposes unified API to create new routes, group them or
 * create route resources.
 *
 * @example
 * ```js
 * const router = new Router()
 * router.get('/', async function () {
 *   // handle request
 * })
 * ```
 */
export class Router implements RouterContract {
  /**
   * Collection of routes, including route resource and route
   * group. To get a flat list of routes, call `router.toJSON()`
   */
  public routes: (Route | RouteResource | RouteGroup | BriskRoute)[] = []

  /**
   * Global matchers to test route params against regular expressions.
   */
  private _matchers: Matchers = {}

  /**
   * Store with tokenized routes
   */
  private _store: Store = new Store()

  /**
   * Lookup store to find route by it's name, handler or pattern
   * and then form a complete URL from it
   */
  private _lookupStore: LookupNode[] = []

  /**
   * A boolean to tell the router that a group is in
   * open state right now
   */
  private _inGroup: boolean = false

  /**
   * Temporary array to hold routes and resources created inside
   * a group. Once we pass them to the group, this array
   * will be free.
   */
  private _groupRoutes: (Route | RouteResource | BriskRoute)[] = []

  constructor (private _routeProcessor?: (route: RouteNode) => void) {
  }

  /**
   * Add route for a given pattern and methods
   */
  public route (pattern: string, methods: string[], handler: any): Route {
    const route = new Route(pattern, methods, handler, this._matchers)

    if (this._inGroup) {
      this._groupRoutes.push(route)
    } else {
      this.routes.push(route)
    }

    return route
  }

  /**
   * Define a route that handles all common HTTP methods
   */
  public any (pattern: string, handler: any): Route {
    return this.route(pattern, ['HEAD', 'OPTIONS','GET', 'POST', 'PUT', 'PATCH', 'DELETE'], handler)
  }

  /**
   * Define `GET` route
   */
  public get (pattern: string, handler: any): Route {
    return this.route(pattern, ['GET'], handler)
  }

  /**
   * Define `POST` route
   */
  public post (pattern: string, handler: any): Route {
    return this.route(pattern, ['POST'], handler)
  }

  /**
   * Define `PUT` route
   */
  public put (pattern: string, handler: any): Route {
    return this.route(pattern, ['PUT'], handler)
  }

  /**
   * Define `PATCH` route
   */
  public patch (pattern: string, handler: any): Route {
    return this.route(pattern, ['PATCH'], handler)
  }

  /**
   * Define `DELETE` route
   */
  public destroy (pattern: string, handler: any): Route {
    return this.route(pattern, ['DELETE'], handler)
  }

  /**
   * Creates a group of routes. A route group can apply transforms
   * to routes in bulk
   */
  public group (callback: () => void): RouteGroup {
    /**
     * Set the flag that we are in a group
     */
    this._inGroup = true

    /**
     * Execute the callback. Now all registered routes will be
     * collected seperately from the `routes` array
     */
    callback()

    /**
     * Create a new group and pass all the routes
     */
    const group = new RouteGroup(this._groupRoutes)

    /**
     * Keep a reference of the group
     */
    this.routes.push(group)

    /**
     * Cleanup temporary data and set flag to false
     */
    this._inGroup = false
    this._groupRoutes = []

    return group
  }

  /**
   * Registers a route resource with conventional set of routes
   */
  public resource (resource: string, controller: string): RouteResource {
    const resourceInstance = new RouteResource(resource, controller, this._matchers)

    if (this._inGroup) {
      this._groupRoutes.push(resourceInstance)
    } else {
      this.routes.push(resourceInstance)
    }

    return resourceInstance
  }

  /**
   * Register a route resource with shallow nested routes.
   */
  public shallowResource (resource: string, controller: string): RouteResource {
    const resourceInstance = new RouteResource(resource, controller, this._matchers, true)

    if (this._inGroup) {
      this._groupRoutes.push(resourceInstance)
    } else {
      this.routes.push(resourceInstance)
    }

    return resourceInstance
  }

  public on (pattern: string): BriskRoute {
    const briskRoute = new BriskRoute(pattern, this._matchers)

    if (this._inGroup) {
      this._groupRoutes.push(briskRoute)
    } else {
      this.routes.push(briskRoute)
    }

    return briskRoute
  }

  /**
   * Returns a flat list of routes JSON
   */
  public toJSON () {
    return toRoutesJSON(this.routes)
  }

  /**
   * Commit routes to the store. After this, no more
   * routes can be registered.
   */
  public commit () {
    const names: string[] = []

    this.toJSON().forEach((route) => {
      /**
       * Raise error when route name is already in use. Route names have to be unique
       * to ensure that only one route is returned during lookup.
       */
      if (route.name && names.indexOf(route.name) > -1) {
        throw new Error(`Duplicate route name \`${route.name}\``)
      }

      /**
       * If route has a unique, then track the name for checking duplicates
       */
      if (route.name) {
        names.push(route.name)
      }

      /**
       * If a pre-processor is defined then pass the [[RouteNode]]
       * to it.
       */
      if (this._routeProcessor) {
        this._routeProcessor(route)
      }

      /**
       * Maintain an array of values, using which a route can be lookedup. The `handler` lookup
       * only works, when Handler is defined as a string
       */
      this._lookupStore.push({
        handler: route.handler,
        name: route.name,
        pattern: route.pattern,
        domain: route.domain || 'root',
      })

      this._store.add(route)
    })

    this.routes = []
    this._matchers = {}
    this._groupRoutes = []
  }

  /**
   * Find route for a given URL, method and optionally domain
   */
  public find (url: string, method: string, domain?: string): null | MatchedRoute {
    return this._store.match(url, method, domain)
  }

  /**
   * Makes the URL for a pre-registered route. The `params` is required to
   * substitute values for dynamic segments and `qs` is optional for
   * adding query string.
   *
   * If the domain for the route is defined, then a protocol relative URL for that
   * domain will be returned.
   */
  public urlFor (pattern: string, options: { params?: any, qs?: any }, domain?: string): null | string {
    options = Object.assign({ params: {}, qs: {} }, options)

    /**
     * Find where route pattern or name or handler matches
     */
    const matchingRoute = this._lookupStore.find((route) => {
      return [route.name, route.pattern, route.handler].indexOf(pattern) > -1 && (!domain || domain === route.domain)
    })

    /**
     * Return null if unable to lookup route
     */
    if (!matchingRoute) {
      return null
    }

    let url = matchingRoute.pattern

    if (url.indexOf(':') > -1) {
      /**
       * Split pattern when route has dynamic segments
       */
      const tokens = url.split('/')

      /**
       * Lookup over the route tokens and replace them the params values
       */
      url = tokens.map((token) => {
        if (!token.startsWith(':')) {
          return token
        }

        const isOptional = token.endsWith('?')
        const paramName = token.replace(/^:/, '').replace(/\?$/, '')
        const param = options.params[paramName]

        /**
         * A required param is always required to make the complete URL
         */
        if (!param && !isOptional) {
          throw new Error(`\`${paramName}\` param is required to make URL for \`${matchingRoute.pattern}\` route`)
        }

        return param
      }).join('/')
    }

    /**
     * Stringify query string and append to the URL (if exists)
     */
    const qs = stringify(options.qs)
    url = qs ? `${url}?${qs}` : url

    return matchingRoute.domain !== 'root' ? `//${matchingRoute.domain}${url}` : url
  }
}
