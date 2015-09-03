'use strict'

let rootPath = null
let appPath = null
let appNameSpace = null

const path = require('path')

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
 */
Helpers.basePath = function () {
  return rootPath
}

/**
 * @function appPath
 * @description Returns path to application folder
 * which is defined under a given namespace.
 * @return {String}
 */
Helpers.appPath = function () {
  return appPath
}

/**
 * @function publicPath
 * @description Returns path to application public folder
 * @return {String}
 */
Helpers.publicPath = function () {
  return path.join(rootPath, './public')
}

/**
 * @function appNameSpace
 * @description Returns application namespace , under which
 * app directory is registered.
 * @return {String}
 */
Helpers.appNameSpace = function () {
  return appNameSpace
}

/**
 * @function configPath
 * @description returns path to config directory
 * @return {String}
 */
Helpers.configPath = function () {
  return path.join(rootPath, './config')
}

/**
 * @function storagePath
 * @description returns reference to storage path of application
 * @return {String}
 */
Helpers.storagePath = function () {
  return path.join(rootPath, './storage')
}

/**
 * @function resourcesPath
 * @description returns reference to resources directory
 * @return {String}
 */
Helpers.resourcesPath = function () {
  return path.join(rootPath, './resources')
}

/**
 * @function viewsPath
 * @description returns reference to views directory
 * @return {String}
 */
Helpers.viewsPath = function () {
  return path.join(rootPath, './resources/views')
}
