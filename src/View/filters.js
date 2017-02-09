'use strict'

/**
 * adonis-framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
 */

const CE = require('../Exceptions')

module.exports = function (env, Route) {
  /**
   * adds route filter and makes use of route to build
   * dynamic routes out of the box
   */
  env.addFilter('route', function (val, options) {
    return Route.url(val, options)
  })

  /**
   * returns a route from it's controller action
   */
  env.addFilter('action', function (val, options) {
    const route = Route.getRoute({handler: val})

    if (route === void 0) {
      throw CE.RuntimeException.missingRouteAction(val)
    }

    return Route.url(route.route, options)
  })

  /**
   * output input as json
   */
  env.addFilter('json', function (val, identation) {
    identation = identation || 4
    return JSON.stringify(val, null, identation)
  })
}
