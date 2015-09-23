'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const nunjucks = require('nunjucks')
const path = require('path')
const fs = require('fs')

/**
 * @module viewsLoader
 * @description Custom async implementation of nunjucks views loader
 */
exports = module.exports = nunjucks.Loader.extend({
  /**
   * @function init
   * @description Initiates views loader
   * @param  {String} viewsPath
   * @param  {Boolean} noWatch Not considered
   * @param  {Boolean} noCache
   * @return {void}
   * @public
   */
  init: function (viewsPath, noWatch, noCache) {
    this.viewsPath = path.normalize(viewsPath)
    this.async = true
    this.noCache = !!noCache
  },

  /**
   * @function getSource
   * @description get content of a file required while rendering
   * template
   * @param  {String}   name
   * @param  {Function} callback
   * @return {*}
   * @public
   */
  getSource: function (name, callback) {
    name = path.extname(name) === '.html' ? name : `${name}.html`
    const viewPath = path.resolve(this.viewsPath, name)
    const self = this

    fs.readFile(viewPath, function (err, content) {
      if (err) return callback(null, null)

      callback(null, {
        src: content.toString(),
        path: viewPath,
        noCache: self.noCache
      })
    })
  }
})
