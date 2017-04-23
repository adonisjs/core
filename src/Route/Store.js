'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')

/**
 * Route store is used to store registered routes as an
 * array. It is a singleton store to be exported and
 * used by an part of the application to store
 * routes.
 *
 * For example: {{#crossLink "RouteResource"}}{{/crossLink}} makes
 * use of it to store multiple routes.
 *
 * @class RouteStore
 * @static
 */
class RouteStore {
  constructor () {
    this._routes = []
  }

  /**
   * Add a route to the store
   *
   * @method add
   *
   * @param  {Route} route
   */
  add (route) {
    this._routes.push(route)
  }

  /**
   * Remove route from the store.
   *
   * @method remove
   *
   * @param  {Route} routeToRemove
   *
   * @return {void}
   */
  remove (routeToRemove) {
    _.remove(this._routes, (route) => route === routeToRemove)
  }

  /**
   * Clear all the routes store so far.
   *
   * @method clear
   *
   * @return {void}
   */
  clear () {
    this._routes = []
  }

  /**
   * Returns a list of stored routes.
   *
   * @method list
   *
   * @return {Array}
   */
  list () {
    return this._routes
  }
}

module.exports = new RouteStore()
