'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const helpers = require('./helpers')
const Group = require('./group')
const Resource = require('./resource')
const domains = require('./domains')
const util = require('../../lib/util')
const _ = require('lodash')
const CatLog = require('cat-log')
const logger = new CatLog('adonis:framework')

/**
 * holding reference to registered routes
 * @type {Array}
 * @private
 */
let routes = []

/**
 * holding reference to active Group
 * @type {String}
 * @private
 */
let activeGroup = null

/**
 * Create and register routes using regular expressions
 * @module Route
 */
let Route = exports = module.exports = {}

/**
 * return all registered routes
 *
 * @method routes
 * @return {Object}
 *
 * @public
 */
Route.routes = function () {
  return routes
}

/**
 * clear registered routes and other local variables
 *
 * @method new
 *
 * @public
 */
Route.new = function () {
  activeGroup = null
  routes = []
}

/**
 * a low level method to register route with path,verb
 * and handler
 *
 * @method route
 *
 * @param {string} route - route expression
 * @param {string} verb - http verb/method
 * @param {any} handler - handler to respond to a given request
 *
 * @example
 * Route.route('/welcome', 'GET', function * () {
 *
 * })
 *
 * @public
 */
Route.route = function (route, verb, handler) {
  let constructedRoute = helpers.construct(route, verb, handler, activeGroup)
  routes.push(constructedRoute)
  return this
}

/**
 * register route with GET verb
 *
 * @method get
 *
 * @param  {String} route - route expression
 * @param {any} handler - handler to respond to a given request
 *
 * @example
 * Route.get('/user', function * () {
 *
 * })
 *
 * @public
 */
Route.get = function (route, handler) {
  this.route(route, ['GET', 'HEAD'], handler)
  return this
}

/**
 * registers a get route with null handler
 * which later can be used with render
 * method to render a view.
 *
 * @method on
 *
 * @param  {String} route
 * @return {Object}
 *
 * @public
 */
Route.on = function (route) {
  Route.get(route, null)
  return this
}

/**
 * Replaces the route handler method with a custom
 * closure, to send a given view.
 *
 * @method render
 *
 * @param  {String} view
 * @return {Object}
 *
 * @public
 */
Route.render = function (view) {
  const route = Route._lastRoute()
  route.handler = function * (request, response) {
    yield response.sendView(view, {request})
  }
  return this
}

/**
 * register route with POST verb
 *
 * @method post
 *
 * @param  {String} route - route expression
 * @param {any} handler - handler to respond to a given request
 *
 * @example
 * Route.post('/user', function * () {
 *
 * })
 *
 * @public
 */
Route.post = function (route, handler) {
  this.route(route, 'POST', handler)
  return this
}

/**
 * register route with PUT verb
 *
 * @method put
 *
 * @param  {String} route - route expression
 * @param {any} handler - handler to respond to a given request
 *
 * @example
 * Route.put('/user/:id', function * () {
 *
 * })
 *
 * @public
 */
Route.put = function (route, handler) {
  this.route(route, 'PUT', handler)
  return this
}

/**
 * register route with PATCH verb
 *
 * @method patch
 *
 * @param  {String} route - route expression
 * @param {any} handler - handler to respond to a given request
 *
 * @example
 * Route.patch('/user/:id', function * () {
 *
 * })
 *
 * @public
 */
Route.patch = function (route, handler) {
  this.route(route, 'PATCH', handler)
  return this
}

/**
 * register route with DELETE verb
 *
 * @method delete
 *
 * @param  {String} route - route expression
 * @param {any} handler - handler to respond to a given request
 *
 * @example
 * Route.delete('/user/:id', function * () {
 *
 * })
 *
 * @public
 */
Route.delete = function (route, handler) {
  this.route(route, 'DELETE', handler)
  return this
}

/**
 * register route with OPTIONS verb
 *
 * @method options
 *
 * @param  {String} route - route expression
 * @param {any} handler - handler to respond to a given request
 *
 * @example
 * Route.put('/user/:id', function * () {
 *
 * })
 *
 * @public
 */
Route.options = function (route, handler) {
  this.route(route, 'OPTIONS', handler)
  return this
}

/**
 * registers a route with multiple HTTP verbs
 *
 * @method match
 *
 * @param  {Array} verbs - an array of verbs
 * @param  {String} route - route expression
 * @param {any} handler - handler to respond to a given request
 *
 * @example
 * Route.match(['GET', 'POST'], '/user', function * () {
 *
 * })
 *
 * @public
 */
Route.match = function (verbs, route, handler) {
  verbs = _.map(verbs, function (verb) { return verb.toUpperCase() })
  this.route(route, verbs, handler)
  return this
}

/**
 * registers route for all http verbs
 *
 * @method any
 *
 * @param  {String} route - route expression
 * @param {any} handler - handler to respond to a given request
 *
 * @example
 * Route.any('/user', function * () {
 *
 * })
 *
 * @public
 */
Route.any = function (route, handler) {
  const verbs = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  this.route(route, verbs, handler)
  return this
}

/**
 * giving unique name to a registered route
 *
 * @method as
 *
 * @param  {String} name - name for recently registered route
 *
 * @example
 * Route.get('/user/:id', '...').as('getUser')
 *
 * @public
 */
Route.as = function (name) {
  let lastRoute = Route._lastRoute()
  lastRoute.name = name
  return this
}

/**
 * returns last route registered inside the route store
 *
 * @method lastRoute
 *
 * @return {Object}
 *
 * @private
 */
Route._lastRoute = function () {
  return _.last(routes)
}

/**
 * assign array of named middlewares to route
 *
 * @method middleware
 * @synonym middleware
 *
 * @param  {Mixed} keys - an array of middleware or multiple parameters
 * @return {Object} - reference to this for chaining
 *
 * @example
 * Route.get('...').middleware('auth', 'csrf')
 * Route.get('...').middleware(['auth', 'csrf'])
 *
 * @public
 */
Route.middleware = function () {
  helpers.appendMiddleware(
    Route._lastRoute(),
    util.spread.apply(this, arguments)
  )
  return this
}

/**
 * @see module:Route~middleware
 */
Route.middlewares = function () {
  logger.warn('route@middlewares: consider using method middleware, instead of middlewares')
  Route.middleware.apply(Route, arguments)
}

/**
 * create a new group of routes to apply rules on a group
 * instead of applying them on every route.
 *
 * @method group
 *
 * @param  {String}   name - unqiue name for group
 * @param  {Function} cb - Callback to isolate group
 * @returns {Route.Group} - Instance of route group
 *
 * @example
 * Route.group('v1', function () {
 *
 * }).prefix('/v1').middleware('auth')
 * @public
 */
Route.group = function (name, cb) {
  activeGroup = name
  cb()
  const groupRoutes = _.filter(routes, function (route) {
    return route.group === activeGroup
  })
  activeGroup = null
  return new Group(groupRoutes)
}

/**
 * resolves route for a given url and HTTP verb/method
 *
 * @method resolve
 *
 * @param  {String} urlPath - Path to url
 * @param  {String} verb - Http verb
 * @param  {String} host - Current host
 *
 * @return {Object}
 *
 * @example
 * Route.resolve('/user/1', 'GET', 'localhost')
 *
 * @public
 */
Route.resolve = function (urlPath, verb, host) {
  if (domains.match(host)) {
    urlPath = `${host}${urlPath}`
  }
  let resolvedRoute = helpers.returnMatchingRouteToUrl(routes, urlPath, verb)
  if (_.size(resolvedRoute) === 0) {
    return {}
  }
  return helpers.returnRouteArguments(resolvedRoute, urlPath, host)
}

/**
 * creates a resource of routes based out of conventions
 *
 * @method resource
 * @alias resources
 *
 * @param  {String} name - Resource name
 * @param  {String} controller - Controller to handle resource requests
 * @returns {Route.resources} - Instance of Resources class
 *
 * @example
 * Route.resource('user', 'UserController')
 * Route.resource('post.comments', 'CommentsController')
 *
 * @public
 */
Route.resource = function (name, controller) {
  return new Resource(Route, name, controller)
}
Route.resources = Route.resource

/**
 * creates a valid url based on route pattern and parameters and params
 *
 * @method url
 *
 * @param  {String} pattern
 * @param  {Object} params
 * @return {String}
 *
 * @example
 * Route.url('user/:id', {id: 1})
 *
 * @public
 */
Route.url = function (pattern, params) {
  const namedRoute = _.filter(routes, function (route) {
    return route.name === pattern
  })[0]

  /**
   * if found pattern as a named route, make it using
   * route properties
   */
  if (namedRoute) {
    const resolveRoute = namedRoute.domain ? `${namedRoute.domain}${namedRoute.route}` : namedRoute.route
    return helpers.compileRouteToUrl(resolveRoute, params)
  }
  return helpers.compileRouteToUrl(pattern, params)
}

/**
 * returns a route with it's property
 *
 * @method getRoute
 * @param  {Object} property
 *
 * @example
 * Route.getRoute({name: 'user.show'})
 * Route.getRoute({handler: 'UserController.show'})
 *
 * @return {Object}
 */
Route.getRoute = function (property) {
  const index = _.findIndex(routes, property)
  return routes[index]
}

/**
 * removes a route from routes mapping using it's name
 *
 * @method remove
 *
 * @param  {String} name
 *
 * @example
 * Route.remove('user.create')
 *
 * @public
 */
Route.remove = function (name) {
  const index = _.findIndex(routes, {name})
  routes.splice(index, 1)
}

/**
 * add formats paramters to route defination which makes
 * url to have optional extensions at the end of them.
 *
 * @method formats
 *
 * @param  {Array} formats - array of supported supports
 * @param  {Boolean} [strict=false] - Using strict mode will not register
 *                                    a plain route without any extension
 *
 * @example
 * Route.get('/user', '...').formats(['json', 'xml'])
 *
 * @public
 */
Route.formats = function (formats, strict) {
  const lastRoute = Route._lastRoute()
  helpers.addFormats(lastRoute, formats, strict)
}
