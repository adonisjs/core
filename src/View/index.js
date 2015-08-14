'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - View class for adonis
 */

// importing libs
const nunjucks = require('nunjucks')

// exporting Views class
let View = exports = module.exports = {}

/**
 * configure views by registering views path
 * @param  {String} path_to_views
 */
View.configure = function (path_to_views) {
  nunjucks.configure(path_to_views, {
    autoescape: true
  })
}

/**
 * compile a view with give template and data
 * @param  {String} template_path
 * @param  {Object} data
 * @return {String}
 */
View.make = function (template_path, data) {
  return nunjucks.render(template_path, data)
}
