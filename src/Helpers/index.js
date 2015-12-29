'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2105 Harminder Virk
 * MIT Licensed
*/

const path = require('path')
const CatLog = require('cat-log')
const log = new CatLog('adonis:framework')

let rootPath = null // application root path
let appPath = null // path to application app directory
let appNameSpace = null // autoloading namespace

let Helpers = exports = module.exports = {}

/**
 * @description loads package.json file from application and set required paths
 * and namespace based on same.
 * @method load
 * @param  {String} packagePath
 * @param  {Object} Ioc
 * @return {void}
 */
Helpers.load = function (packagePath, Ioc) {
  log.verbose('reading autoload settings from %s', packagePath)

  rootPath = path.dirname(packagePath)

  /**
   * loading package file and throwing error if
   * autoload is not defined
   */
  const packageFile = require(packagePath)
  if (!packageFile.autoload) {
    throw new Error('autoload must be enable inside package.json file')
  }

  /**
   * throwing error when autoloading key and value are missing
   */
  const autoloadSettings = Object.keys(packageFile.autoload)
  if (!autoloadSettings.length) {
    throw new Error('autoload must be enable inside package.json file')
  }

  /**
   * setting up appNamespace and appPath from autoload
   * obhect inside package.json file
   */
  appNameSpace = autoloadSettings[0]
  appPath = path.join(rootPath, packageFile.autoload[appNameSpace])

  /**
   * if Ioc is defined setup autoloading values
   */
  if (Ioc && Ioc.autoload) {
    Ioc.autoload(appNameSpace, appPath)
  }
}

/**
 * @descrition Returns path to application root
 * @method basePath
 * @return {String}
 */
Helpers.basePath = function () {
  return rootPath
}

/**
 * @description Returns path to application folder which is
 * defined under a given namespace.
 * @method appPath
 * @return {String}
 */
Helpers.appPath = function () {
  return appPath
}

/**
 * @description Returns path to application public folder
 * @method publicPath
 * @param  {String}   toFile
 * @return {String}
 */
Helpers.publicPath = function (toFile) {
  const toDir = './public'
  return Helpers._makePath(rootPath, toDir, toFile)
}

/**
 * @descripption Returns application namespace , under which
 * app directory is registered.
 * @method appNameSpace
 * @return {String}
 */
Helpers.appNameSpace = function () {
  return appNameSpace
}

/**
 * @description returns path to config directory
 * @method configPath
 * @param  {String}   toFile
 * @return {String}
 */
Helpers.configPath = function (toFile) {
  const toDir = './config'
  return Helpers._makePath(rootPath, toDir, toFile)
}

/**
 * @description returns reference to storage path of application
 * @method storagePath
 * @param  {String}    toFile
 * @return {String}
 * @public
 */
Helpers.storagePath = function (toFile) {
  const toDir = './storage'
  return Helpers._makePath(rootPath, toDir, toFile)
}

/**
 * @description returns reference to resources directory
 * @method resourcesPath
 * @param  {String}      toFile
 * @return {String}
 */
Helpers.resourcesPath = function (toFile) {
  const toDir = './resources'
  return Helpers._makePath(rootPath, toDir, toFile)
}

/**
 * @description returns path to migrations directory.
 * @method migrationsPath
 * @param  {String}       toFile
 * @return {String}
 */
Helpers.migrationsPath = function (toFile) {
  const toDir = './migrations'
  return Helpers._makePath(rootPath, toDir, toFile)
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
 * @param  {String}  toDir
 * @param  {String}  toFile
 * @return {String}
 */
Helpers._makePath = function (base, toDir, toFile) {
  const incremental = toFile ? `/${toDir}/${toFile}` : toDir
  return path.join(base, incremental)
}
