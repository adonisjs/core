'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Add glue to http res object by adding helper methods on top of it.
 */

// importing libs
const NodeRes = require('node-res'),
  View = require('../View/index')

/**
 * extending nodeRes prototype to attach view method
 * @param  {String} template_path path to template
 * @param  {Object} data          data to pass to template
 * @return {String}               Compiled template
 */
NodeRes.prototype.view = function (template_path, data) {
  let compiled_template = View.make(template_path, data)
  this.send(compiled_template)
  return this
}

/**
 * Response class
 * @param {Object} request
 * @param {Object} response
 * @constructor
 */
function Response (request, response) {
  NodeRes.call(this, request, response)
}

Response.prototype = Object.create(NodeRes.prototype)
Response.prototype.constructor = Response

module.exports = Response
