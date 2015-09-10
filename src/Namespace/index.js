'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const fold = require('adonis-fold')
const Registerar = fold.Registerar

/**
 * @module Namespace
 * @description Makes use of fold to autoload a given
 * directory based upon .env configuration
 */
function Namespace (Env, Helpers) {
  this.env = Env
  this.helpers = Helpers
}

/**
 * @function register
 * @description registers autoloading config to process.env
 * and autoloads given directory under a defined namespace
 * @param  {Object} packageFile
 * @return {void}
 */
Namespace.prototype.autoload = function () {
  const self = this

  return new Promise(function (resolve, reject) {
    const appDir = self.helpers.appPath()
    const foldNamespace = self.helpers.appNameSpace()

    if (self.env.get('autoload')) {
      Registerar.autoload(appDir, appDir, foldNamespace).then(resolve).catch(reject)
    } else {
      resolve()
    }
  })
}

module.exports = Namespace
