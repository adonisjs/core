'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Add glue to http res object by adding helper methods on top of it.
 */

// importing libs
const NodeRes = require('node-res')
const View = require('../View/index')

function Response(View){

  /**
   * extending nodeRes prototype to attach view method
   * @param  {String} template_path path to template
   * @param  {Object} data          data to pass to template
   * @return {String}               Compiled template
   */
  NodeRes.prototype.view = function (template_path, data) {
    return new Promise(function (resolve, reject) {
      View
        .make(template_path, data)
        .then(resolve)
        .catch(reject)
    })
  }

  return NodeRes

}

module.exports = Response
