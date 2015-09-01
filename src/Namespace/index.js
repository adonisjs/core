'use strict'

const Logger = require('../Logger')

/**
 * @module Namespace
 * @author Harminder Virk
 */
let Namespace = exports = module.exports = {}

/**
 * @function register
 * @description registers autoloading config to process.env
 * @param  {Object} packageFile
 * @return {void}
 */
Namespace.register = function(packageFile){
  if(!packageFile.autoload){
    return Logger.warn('autoloading is not configured inside package.json file, which must be configured')
  }
  const autoloadKeys = Object.keys(packageFile.autoload)
  if(autoloadKeys <= 0){
    return Logger.warn('autoloading is not configured inside package.json file, which must be configured')
  }
  process.env.foldNamespace = packageFile.autoload[autoloadKeys[0]]
}
