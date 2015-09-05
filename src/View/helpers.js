'use strict'

module.exports = function(env,Route){

  env.addFilter('route', function (val) {
    return Route.url(val)
  })

}
