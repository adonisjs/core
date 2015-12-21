'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

module.exports = function (env, Route) {
  /**
   * adds route filter and makes use of route to build
   * dynamic routes out of the box
   */
  env.addFilter('route', function (val, options) {
    return Route.url(val, options)
  })

  /**
   * output input as json
   */
  env.addFilter('json', function (val) {
    return JSON.stringify(val)
  })

}
