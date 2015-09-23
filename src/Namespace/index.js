'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const fold = require('adonis-fold')
const Logger = require('../Logger')
const Ioc = fold.Ioc

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
 * @function autoload
 * @description register appNameSpace and dir to
  Ioc container
 */
Namespace.prototype.autoload = function () {
  const appDir = this.helpers.appPath()
  const foldNamespace = this.helpers.appNameSpace()
  Logger.verbose('setting app directory to %s loaded under %s namespace', appDir, foldNamespace)
  Ioc.dumpSettings(appDir, foldNamespace)
}

module.exports = Namespace
