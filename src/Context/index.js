'use strict'

const Macroable = require('../Macroable')

/**
 * An instance of this class is passed to all route handlers
 * and middleware. Also different part of applications
 * can bind getters to this class.
 * For example: The {{#crossLink "Request"}}{{/crosslink}}, {{#crossLink "View"}}{{/crosslink}} classes binds themselves to the context.
 *
 * @class Context
 * @constructor
 *
 * @example
 * ```
 * const Context = use('Context')
 * Context.getter('view', function () {
 *   return new View()
 * }, true)
 *
 * The last option `true` means the getter is singleton.
 * ```
 */
class Context extends Macroable {
  constructor (req, res) {
    super()
    this.req = req
    this.res = res
  }
}

/**
 * Defining _macros and _getters property
 * for Macroable class
 *
 * @type {Object}
 */
Context._macros = {}
Context._getters = {}

module.exports = Context
