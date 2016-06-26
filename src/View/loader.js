'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const nunjucks = require('nunjucks')
const path = require('path')
const fs = require('fs')

/**
 * Views loader
 * @module
 * @alias Views.Loader
 */
exports = module.exports = nunjucks.Loader.extend({
  /**
   * Initiates views loader
   *
   * @param  {String} viewsPath
   * @param  {Boolean} noWatch Not considered
   * @param  {Boolean} noCache
   *
   * @public
   */
  init: function (viewsPath, noWatch, noCache) {
    this.viewsPath = path.normalize(viewsPath)
    this.async = true
    this.noCache = !!noCache
  },

  /**
   * get content of a file required while rendering
   * template
   *
   * @param  {String}   name
   * @param  {Function} callback
   *
   * @public
   */
  getSource: function (name, callback) {
    name = name.replace(/((?!\.+\/)\.(?!njk))/g, '/')
    name = path.extname(name) === '.njk' ? name : `${name}.njk`
    const viewPath = path.resolve(this.viewsPath, name)
    const self = this

    fs.readFile(viewPath, function (err, content) {
      if (err) {
        callback(null, null)
        return
      }
      callback(null, {
        src: content.toString(),
        path: viewPath,
        noCache: self.noCache
      })
    })
  }
})
