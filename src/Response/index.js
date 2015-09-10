'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const NodeRes = require('node-res')

function Response (View, Route) {
  /**
   * @function view
   * @description extending nodeRes prototype to attach view method
   * @param  {String} template_path path to template
   * @param  {Object} data          data to pass to template
   * @return {String}               Compiled template
   * @public
   */
  NodeRes.prototype.view = function (template_path, data) {
    return new Promise(function (resolve, reject) {
      View
        .make(template_path, data)
        .then(resolve)
        .catch(reject)
    })
  }

  /**
   * @function route
   * @description redirect to a given route
   * @param  {String} route
   * @param  {Object} data
   */
  NodeRes.prototype.route = function (route, data) {
    const toRoute = Route.url(route, data)
    this.redirect(toRoute)
  }

  return NodeRes

}

module.exports = Response
