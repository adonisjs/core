/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import edge, { type Edge } from 'edge.js'
import { type URLOptions } from '../types/http.ts'
import type { ApplicationService } from '../src/types.ts'
import numberHelpers from '../src/helpers/number.ts'
import { pluginEdgeDumper } from '../modules/dumper/plugins/edge.ts'
import { BriskRoute, HttpContext, Qs, type Route, type Router } from '../modules/http/main.ts'
import { type ClientRouteJSON } from '@adonisjs/http-server/client/url_builder'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    /**
     * Reference to the edge renderer to render templates
     * during an HTTP request
     */
    view: ReturnType<Edge['createRenderer']>
  }

  interface BriskRoute {
    /**
     * Render an edge template without defining an
     * explicit route handler
     */
    render(template: string, data?: Record<string, any>): Route
  }
}

/**
 * The Edge service provider configures Edge to work within
 * an AdonisJS application environment
 *
 * This provider integrates EdgeJS template engine with AdonisJS by:
 * - Mounting the views directory
 * - Configuring template caching for production
 * - Adding global helpers for route generation
 * - Creating isolated renderer instances for HTTP contexts
 * - Adding render macro to BriskRoute for template rendering
 *
 * @example
 * const provider = new EdgeServiceProvider(app)
 * await provider.boot()
 */
export default class EdgeServiceProvider {
  /**
   * Edge service provider constructor
   *
   * Sets the usingEdgeJS flag to true to indicate EdgeJS is being used.
   *
   * @param app - The application service instance
   */
  constructor(protected app: ApplicationService) {
    this.app.usingEdgeJS = true
  }

  /**
   * Bridge AdonisJS and Edge
   *
   * Configures EdgeJS integration by:
   * - Setting up template mounting and caching
   * - Defining global helpers (route, signedRoute, app, config)
   * - Adding view getter to HttpContext for isolated rendering
   * - Adding render macro to BriskRoute
   * - Registering dumper plugin
   *
   * @example
   * await provider.boot()
   * // Now edge templates can use {{ route('home') }} helper
   */
  async boot() {
    const app = this.app
    const qs = new Qs(app.config.get<any>('app.http.qs', {}))
    const router = await this.app.container.make('router')
    const dumper = await this.app.container.make('dumper')

    /**
     * Resolves configuration values for Edge templates
     *
     * Provides access to application configuration within templates.
     * Includes a 'has' method to check for config key existence.
     *
     * @param key - The configuration key to retrieve
     * @param defaultValue - Optional default value if key doesn't exist
     */
    function edgeConfigResolver(key: string, defaultValue?: any) {
      return app.config.get(key, defaultValue)
    }
    edgeConfigResolver.has = function (key: string) {
      return app.config.has(key)
    }

    /**
     * Generates client-side route definitions for frontend use
     *
     * Transforms router definitions into a serializable format that
     * can be used in client-side JavaScript for route generation.
     * Only includes named routes.
     */
    function clientRoutes() {
      const routes = router.toJSON()
      return Object.keys(routes).reduce<Record<string, ClientRouteJSON[]>>((result, domain) => {
        result[domain] = routes[domain].reduce<ClientRouteJSON[]>((routesResult, route) => {
          if (!route.name) {
            return routesResult
          }
          routesResult.push({
            domain: route.domain,
            methods: route.methods,
            pattern: route.pattern,
            tokens: route.tokens,
            name: route.name,
          })
          return routesResult
        }, [])
        return result
      }, {})
    }

    /**
     * Mount the default disk
     */
    edge.mount(app.viewsPath())

    /**
     * Cache templates in production
     */
    edge.configure({ cache: app.inProduction })

    /**
     * Define Edge global helpers
     * @deprecated
     */
    edge.global('route', function (...args: Parameters<Router['makeUrl']>) {
      return router.makeUrl(...args)
    })
    edge.global('signedRoute', function (...args: Parameters<Router['makeSignedUrl']>) {
      return router.makeSignedUrl(...args)
    })

    edge.global('app', app)
    edge.global('config', edgeConfigResolver)
    edge.global('number', numberHelpers)
    edge.global('routes', function () {
      return clientRoutes()
    })
    edge.global('routesJSON', function () {
      return JSON.stringify(clientRoutes())
    })

    /**
     * Route helpers
     */
    edge.global('urlFor', function (...args: any[]) {
      return (router.urlBuilder.urlFor as any)(...args)
    })
    edge.global('signedUrlFor', function (...args: any[]) {
      return (router.urlBuilder.signedUrlFor as any)(...args)
    })

    /**
     * Sharing qs parser with templates
     */
    edge.global('qs', qs)

    edge.global('formAttributes', function (route: string, params: any, options: URLOptions) {
      const matchingRoute = router.findOrFail(route)

      /**
       * Normalize method and keep a reference to the original method
       */
      options = options ?? {}
      let method = matchingRoute.methods[0].toUpperCase()
      const original = method

      /**
       * In case of HEAD, we must use the GET method
       */
      if (method === 'HEAD') {
        method = 'GET'
      }

      /**
       * If method if not GET and POST, then use the querystring _method
       * to and force update the method to "POST"
       */
      if (method !== 'GET' && method !== 'POST') {
        method = 'POST'
        options = { ...options, qs: { _method: original, ...options.qs } }
      }

      const { action } = (router.urlBuilder.urlFor.method as any)(
        original,
        route,
        params,
        options
      ).form

      return {
        action,
        method,
      }
    })

    /**
     * Creating a isolated instance of edge renderer
     */
    HttpContext.getter(
      'view',
      function (this: HttpContext) {
        return edge.createRenderer().share({
          request: this.request,
        })
      },
      true
    )

    /**
     * Adding brisk route to render templates without an
     * explicit handler
     */
    BriskRoute.macro('render', function (this: BriskRoute, template, data) {
      function rendersTemplate({ view }: HttpContext) {
        return view.render(template, data)
      }
      Object.defineProperty(rendersTemplate, 'listArgs', { value: template, writable: false })
      return this.setHandler(rendersTemplate)
    })

    edge.use(pluginEdgeDumper(dumper))
  }
}
