/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as pick from 'object.pick'
import * as matchit from '../matchit'
import { RouteDefination, RouteNode } from './Contracts'

/**
 * An object of routes for a given HTTP method
 */
type MethodNode = {
  tokens: any[],
  routes: {
    [pattern: string]: RouteNode,
  },
}

/**
 * Each domain node will have an object of methods and then
 * a nested object of routes
 */
type DomainNode = {
  [method: string]: MethodNode,
}

/**
 * Routes tree is a domain of DomainNodes
 */
type RoutesTree = {
  tokens: any[],
  domains: {
    [domain: string]: DomainNode,
  },
}

/**
 * Shape of the matched route for a given
 * url inside a given domain
 */
type MatchedRoute = {
  route: RouteNode,
  params: any,
  subdomains: any,
}

/**
 * Store class is used to store a list of routes, along side with their tokens
 * to match the URL's. The used data structures to store information is tailored
 * for quick lookups.
 *
 * @example
 * ```js
 * const store = new Store()
 *
 * store.add({
 *  pattern: 'posts/:id',
 *  handler: function onRoute () {},
 *  middleware: [],
 *  matchers: {
 *    id: '^[0-9]$+'
 *  },
 *  meta: {},
 *  methods: ['GET']
 * })
 *
 * store.match('posts/1', 'GET')
 * ```
 */
export class Store {
  private _routes: RoutesTree = { tokens: [], domains: {} }

  /**
   * Returns the domain node for a given domain. If domain node is missing,
   * it will added to the routes object and tokens are also generated
   */
  private _getDomainNode (domain: string): DomainNode {
    if (!this._routes.domains[domain]) {
      this._routes.tokens.push(matchit.parse(domain))
      this._routes.domains[domain] = {}
    }

    return this._routes.domains[domain]
  }

  /**
   * Returns the method node for a given domain and method. If method is
   * missing, it will be added to the domain node
   */
  private _getMethodRoutes (domain: string, method: string): MethodNode {
    const domainNode = this._getDomainNode(domain)
    if (!domainNode[method]) {
      domainNode[method] = { tokens: [], routes: {} }
    }

    return domainNode[method]
  }

  /**
   * Adds a route to the store for all the given HTTP methods. Also an array
   * of tokens is generated for the route pattern. The tokens are then
   * matched against the URL to find the appropriate route.
   *
   * @example
   * ```js
   * store.add({
   *   pattern: 'post/:id',
   *   methods: ['GET'],
   *   matchers: {},
   *   meta: {},
   *   handler: function handler () {
   *   }
   * })
   * ```
   */
  public add (route: RouteDefination): this {
    route.methods.forEach((method) => {
      const methodRoutes = this._getMethodRoutes(route.domain || 'root', method)

      /**
       * Ensure that route doesn't pre-exists. In that case, we need to throw
       * the exception, since it's a programmer error to create multiple
       * routes with the same pattern.
       */
      if (methodRoutes.routes[route.pattern]) {
        const error = new Error(`Route ${method}:${route.pattern} is already registered`) as NodeJS.ErrnoException
        error.code = 'E_DUPLICATE_ROUTE'
        throw error
      }

      /**
       * Generate tokens for the given route and push to the list
       * of tokens
       */
      methodRoutes.tokens.push(matchit.parse(route.pattern, route.matchers))

      /**
       * Store reference to the route, so that we can return it to the user, when
       * they call `match`.
       */
      methodRoutes.routes[route.pattern] = pick(route, [
        'pattern',
        'handler',
        'meta',
        'matchers',
        'middleware',
      ])
    })

    return this
  }

  /**
   * Matches the url, method and optionally domain to pull the matching
   * route. `null` is returned when unable to match the URL against
   * registered routes.
   */
  public match (url: string, method: string, domain?: string): null | MatchedRoute {
    /**
     * Start by matching the domain and return null, if unable to find
     * the domain
     */
    const matchedDomain = matchit.match(domain || 'root', this._routes.tokens)
    if (!matchedDomain.length) {
      return null
    }

    /**
     * Next get the method node for the given method inside the domain. If
     * method node is missing, means no routes ever got registered for that
     * method
     */
    const matchedMethod = this._routes.domains[matchedDomain[0].old][method]
    if (!matchedMethod) {
      return null
    }

    /**
     * Next, match route for the given url inside the tokens list for the
     * matchedMethod
     */
    const matchedRoute = matchit.match(url, matchedMethod.tokens)
    if (!matchedRoute.length) {
      return null
    }

    return {
      route: matchedMethod.routes[matchedRoute[0].old],
      params: matchit.exec(url, matchedRoute),
      subdomains: matchit.exec(domain || 'root', matchedDomain),
    }
  }

  /**
   * Copy of registered routes. Not subjective to mutations
   */
  public toJSON (): RoutesTree {
    return this._routes
  }
}
