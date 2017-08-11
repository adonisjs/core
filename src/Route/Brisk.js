'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const GE = require('@adonisjs/generic-exceptions')
const Macroable = require('macroable')
const RouteStore = require('./Store')
const Route = require('./index')

class BriskRoute extends Macroable {
  constructor (routePath) {
    super()
    this.routePath = routePath
    this._handlerDefined = false
  }

  /**
   * Sets the handler for brisk route.
   *
   * @method setHandler
   *
   * @param  {Function|String}   handler
   * @param  {Array}   verbs
   *
   * @return {Route}
   *
   * @throws {RuntimeException} If trying to re-define handler for the route
   */
  setHandler (handler, verbs) {
    if (this._handlerDefined) {
      throw GE.RuntimeException.invoke('Cannot re-define handler for brisk route')
    }

    const routeInstance = new Route(this.routePath, handler, verbs)
    RouteStore.add(routeInstance)
    this._handlerDefined = true
    return routeInstance
  }

  /**
   * Render a view from the route
   *
   * @method render
   *
   * @param  {String} template
   * @param  {Object} data
   *
   * @return {Route}
   */
  render (template, data = {}) {
    return this.setHandler(({ view }) => {
      return view.render(template, data)
    }, ['GET', 'HEAD'])
  }
}

/**
 * Defining _macros and _getters property
 * for Macroable class
 *
 * @type {Object}
 */
BriskRoute._macros = {}
BriskRoute._getters = {}

module.exports = BriskRoute
