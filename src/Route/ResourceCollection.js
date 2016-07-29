'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const helpers = require('./helpers')
const util = require('../../lib/util')
const CatLog = require('cat-log')
const logger = new CatLog('adonis:framework')

class ResourceCollection {

  constructor (route) {
    this.route = route
  }

  /**
   * binds action to the route, it will override
   * the old action
   *
   * @param  {String|Function} action
   *
   * @return {Object}
   *
   * @public
   */
  bindAction (action) {
    this.route.handler = action
    return this
  }

  /**
   * @see this.middleware
   */
  middlewares () {
    logger.warn('collection@middlewares: consider using method middleware, instead of middlewares')
    return this.middleware.apply(this, arguments)
  }

  /**
   * appends middlewares to the route
   *
   * @return {Object}
   *
   * @public
   */
  middleware () {
    helpers.appendMiddleware(
      this.route,
      util.spread.apply(this, arguments)
    )
    return this
  }

  /**
   * assign name to the route
   *
   * @param  {String} name
   *
   * @return {Object}
   *
   * @public
   */
  as (name) {
    this.route.name = name
    return this
  }

  /**
   * return json representation of the route
   *
   * @return {Object}
   *
   * @public
   */
  toJSON () {
    return this.route
  }

}

module.exports = ResourceCollection
