/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import edge, { type Edge } from 'edge.js'
import type { ApplicationService } from '../src/types.js'
import { BriskRoute, HttpContext, type Route, type Router } from '../modules/http/main.js'

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
 */
export default class EdgeServiceProvider {
  constructor(protected app: ApplicationService) {
    this.app.usingEdgeJS = true
  }

  /**
   * Bridge AdonisJS and Edge
   */
  async boot() {
    const app = this.app
    const router = await this.app.container.make('router')

    function edgeConfigResolver(key: string, defaultValue?: any) {
      return app.config.get(key, defaultValue)
    }
    edgeConfigResolver.has = function (key: string) {
      return app.config.has(key)
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
     */
    edge.global('route', function (...args: Parameters<Router['makeUrl']>) {
      return router.makeUrl(...args)
    })
    edge.global('signedRoute', function (...args: Parameters<Router['makeSignedUrl']>) {
      return router.makeSignedUrl(...args)
    })
    edge.global('app', app)
    edge.global('config', edgeConfigResolver)

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
      return this.setHandler(({ view }) => {
        return view.render(template, data)
      })
    })
  }
}
