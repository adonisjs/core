'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const nunjucks = require('nunjucks')
const ViewLoader = require('./loader')
const viewFilters = require('./filters')
const viewExtensions = require('./extensions')

/**
 * @module View
 * @description View class for adonis framework ,
 * serve jinja like views
 */
function View (Helpers, Env, Route) {
  const viewsPath = Helpers.viewsPath()
  const viewsCache = Env.get('CACHE_VIEWS') === 'true'
  this.viewsEnv = new nunjucks.Environment(new ViewLoader(viewsPath, false, !viewsCache))
  viewExtensions(this.viewsEnv)
  viewFilters(this.viewsEnv, Route)
}

/**
 * @description compile a view with give template and data
 * @method make
 * @param  {String} template_path
 * @param  {Object} data
 * @return {Promise}
 * @public
 */
View.prototype.make = function (template_path, data) {
  let self = this
  return new Promise(function (resolve, reject) {
    self.viewsEnv.render(template_path, data, function (err, templateContent) {
      if (err) {
        reject(err)
      } else {
        resolve(templateContent)
      }
    })
  })
}

module.exports = View
