'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - View class for adonis
 */

let env = null

// importing libs
const nunjucks = require('nunjucks')
const viewsLoader = require('./loader')
const viewsExtensions = require('./extensions')

// exporting Views class
let View = exports = module.exports = {}

/**
 * configure views by registering views path
 * @param  {String} path_to_views
 */
View.configure = function (path_to_views) {
  env = new nunjucks.Environment(new viewsLoader(path_to_views));
  viewsExtensions(env)
}

/**
 * compile a view with give template and data
 * @param  {String} template_path
 * @param  {Object} data
 * @return {Promise}
 */
View.make = function (template_path, data) {
  return new Promise(function(resolve, reject){
    env.render(template_path, data, function(err,templateContent){
      if(err) return reject(err)
      resolve(templateContent)
    })
  })
}
