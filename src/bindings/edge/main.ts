/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import edge from 'edge.js'

import './types.js'
import type { ApplicationService } from '../../types.js'
import { HttpContext, BriskRoute, type Router } from '../../../modules/http/main.js'

/**
 * Bridges AdonisJS with Edge
 */
export function bridgeEdgeAdonisJS(app: ApplicationService, router: Router) {
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
  HttpContext.getter('view', function (this: HttpContext) {
    return edge.createRenderer().share({
      request: this.request,
    })
  })

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
