'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
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
function View (Helpers, Config, Route) {
  const viewsPath = Helpers.viewsPath()
  const viewsCache = Config.get('app.views.cache', true)
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

/**
 * @description add a filter to view, it also support async execution
 * @method filter
 * @param  {String}   name
 * @param  {Function} callback
 * @param  {Boolean}   async
 * @return {void}
 * @public
 */
View.prototype.filter = function (name, callback, async) {
  this.viewsEnv.addFilter(name, callback, async)
}

/**
 * @description add a global method to views
 * @method global
 * @param  {String} name
 * @param  {Mixed} value
 * @return {void}
 * @public
 */
View.prototype.global = function (name, value) {
  this.viewsEnv.addGlobal(name, value)
}

module.exports = View
