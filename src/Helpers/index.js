'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const path = require('path')
const debug = require('debug')('adonis:framework')

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
 * @description loads package.json file from application
 * and set required paths and namespace based on same.
 * @method load
 * @param  {String} packagePath
 * @return {void}
 * @public
 */
Helpers.load = function (packagePath) {
  debug('reading application config from %s', packagePath)

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
 * @description Returns path to application root.
 * @method basePath
 * @return {String}
 * @public
 */
Helpers.basePath = function () {
  return rootPath
}

/**
 * @description Returns path to application folder
 * which is defined under a given namespace.
 * @method appPath
 * @return {String}
 * @public
 */
Helpers.appPath = function () {
  return appPath
}

/**
 * @description Returns path to application public folder
 * @method publicPath
 * @return {String}
 * @public
 */
Helpers.publicPath = function (toFile) {
  const toDir = './public'
  const incrementalPath = typeof (toFile) !== 'undefined' ? `/${toDir}/${toFile}` : toDir
  return Helpers._makePath(rootPath, incrementalPath)
}

/**
 * @description Returns application namespace , under which
 * app directory is registered.
 * @method appNameSpace
 * @return {String}
 * @public
 */
Helpers.appNameSpace = function () {
  return appNameSpace
}

/**
 * @description returns path to config directory
 * @method configPath
 * @return {String}
 * @public
 */
Helpers.configPath = function (toFile) {
  const toDir = './config'
  const incrementalPath = typeof (toFile) !== 'undefined' ? `/${toDir}/${toFile}` : toDir
  return Helpers._makePath(rootPath, incrementalPath)
}

/**
 * @description returns reference to storage path of application
 * @method storagePath
 * @return {String}
 * @public
 */
Helpers.storagePath = function (toFile) {
  const toDir = './storage'
  const incrementalPath = typeof (toFile) !== 'undefined' ? `/${toDir}/${toFile}` : toDir
  return Helpers._makePath(rootPath, incrementalPath)
}

/**
 * @description returns reference to resources directory
 * @method resourcesPath
 * @return {String}
 * @public
 */
Helpers.resourcesPath = function (toFile) {
  const toDir = './resources'
  const incrementalPath = typeof (toFile) !== 'undefined' ? `/${toDir}/${toFile}` : toDir
  return Helpers._makePath(rootPath, incrementalPath)
}

/**
 * @description returns path to migrations directory
 * @method migrationsPath
 * @param  {String} toFile
 * @return {Strings}
 */
Helpers.migrationsPath = function (toFile) {
  const toDir = './migrations'
  const incrementalPath = typeof (toFile) !== 'undefined' ? `/${toDir}/${toFile}` : toDir
  return Helpers._makePath(rootPath, incrementalPath)
}

/**
 * @description returns reference to views directory
 * @method viewsPath
 * @return {String}
 */
Helpers.viewsPath = function () {
  return Helpers.resourcesPath('views')
}

/**
 * @description makes path by joining two endpoints
 * @method _makePath
 * @param  {String}  base
 * @param  {String}  incremental
 * @return {String}
 * @private
 */
Helpers._makePath = function (base, incremental) {
  return path.join(base, incremental)
}
