/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * HTTP helper utilities re-exported from @adonisjs/http-server. This module
 * provides a convenient entry point for accessing all HTTP-related utilities
 * including route helpers, middleware utilities, and request/response helpers.
 *
 * @example
 * // Import specific HTTP helpers
 * import { middlewareInfo, routeInfo } from '@adonisjs/core/helpers'
 *
 * const middleware = middlewareInfo('cors', CorsMiddleware)
 * const route = routeInfo('users.show', '/users/:id')
 *
 * @example
 * // Access all HTTP helpers
 * import * as httpHelpers from '@adonisjs/core/helpers/http'
 * 
 * // Use any helper from the http-server package
 * const routeData = httpHelpers.routeInfo('api.posts', '/api/posts')
 */
export * from '@adonisjs/http-server/helpers'
