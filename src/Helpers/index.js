'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const path = require('path')

/**
 * application root path
 * @private
 */
let rootPath = null

/**
 * path to application app directory
 * @private
 */
let appPath = null

/**
 * app directory namespace
 * @private
 */
let appNameSpace = null

/**
 * @module Helpers
 * @description Gives an easy api to access frequently used paths
 * inside adonis application.
 */
let Helpers = exports = module.exports = {}

/**
 * @function load
 * @description loads package.json file from application
 * and set required paths and namespace based on same.
 * @param  {String} packagePath [description]
 * @return {void}             [description]
 * @public
 */
Helpers.load = function (packagePath) {
  rootPath = path.dirname(packagePath)
  const packageFile = require(packagePath)
  if (!packageFile.autoload) {
    throw new Error('autoload must be enable inside package.json file')
  }
  const autoloadSettings = Object.keys(packageFile.autoload)
  if (!autoloadSettings.length) {
    throw new Error('autoload must be enable inside package.json file')
  }
  appNameSpace = autoloadSettings[0]
  appPath = path.join(rootPath, packageFile.autoload[appNameSpace])
}

/**
 * @function basePath
 * @description Returns path to application root.
 * @return {String}
 * @public
 */
Helpers.basePath = function () {
  return rootPath
}

/**
 * @function appPath
 * @description Returns path to application folder
 * which is defined under a given namespace.
 * @return {String}
 * @public
 */
Helpers.appPath = function () {
  return appPath
}

/**
 * @function publicPath
 * @description Returns path to application public folder
 * @return {String}
 * @public
 */
Helpers.publicPath = function (toFile) {
  const configDir = './public'
  const incrementalPath = typeof(toFile) !== 'undefined' ? `/${configDir}/${toFile}` : configDir
  return Helpers._makePath(rootPath,incrementalPath)
}

/**
 * @function appNameSpace
 * @description Returns application namespace , under which
 * app directory is registered.
 * @return {String}
 * @public
 */
Helpers.appNameSpace = function () {
  return appNameSpace
}

/**
 * @function configPath
 * @description returns path to config directory
 * @return {String}
 * @public
 */
Helpers.configPath = function (toFile) {
  const configDir = './config'
  const incrementalPath = typeof(toFile) !== 'undefined' ? `/${configDir}/${toFile}` : configDir
  return Helpers._makePath(rootPath,incrementalPath)
}

/**
 * @function storagePath
 * @description returns reference to storage path of application
 * @return {String}
 * @public
 */
Helpers.storagePath = function (toFile) {
  const configDir = './storage'
  const incrementalPath = typeof(toFile) !== 'undefined' ? `/${configDir}/${toFile}` : configDir
  return Helpers._makePath(rootPath,incrementalPath)
}

/**
 * @function resourcesPath
 * @description returns reference to resources directory
 * @return {String}
 * @public
 */
Helpers.resourcesPath = function (toFile) {
  const configDir = './resources'
  const incrementalPath = typeof(toFile) !== 'undefined' ? `/${configDir}/${toFile}` : configDir
  return Helpers._makePath(rootPath,incrementalPath)
}

/**
 * @function viewsPath
 * @description returns reference to views directory
 * @return {String}
 */
Helpers.viewsPath = function () {
  return Helpers.resourcesPath('views')
}


Helpers._makePath = function (base,incremental) {
  return path.join(base,incremental)
}
