'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - View class for adonis
 */

// importing libs
const nunjucks = require('nunjucks')
const ViewsLoader = require('./loader')
const viewsExtensions = require('./extensions')

function View (Helpers) {
  const viewsPath = Helpers.viewsPath()
  this.viewsEnv = new nunjucks.Environment(new ViewsLoader(viewsPath))
  viewsExtensions(this.viewsEnv)
}

/**
 * compile a view with give template and data
 * @param  {String} template_path
 * @param  {Object} data
 * @return {Promise}
 */
View.prototype.make = function (template_path, data) {
  let self = this
  return new Promise(function (resolve, reject) {
    self.viewsEnv.render(template_path, data, function (err, templateContent) {
      if (err) return reject(err)
      resolve(templateContent)
    })
  })
}

module.exports = View
