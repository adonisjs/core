/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type Edge } from 'edge.js'
import type { Route } from '../../../modules/http/main.js'

declare module '@adonisjs/http-server' {
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
