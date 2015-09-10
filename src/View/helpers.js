'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

module.exports = function (env, Route) {
  env.addFilter('route', function (val) {
    return Route.url(val)
  })

}
