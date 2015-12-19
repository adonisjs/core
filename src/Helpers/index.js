'use strict'

/**
 * @author         Harminder Virk <virk.officials@gmail.com>
 *
 * @package        adonis-framework
 * @copyright      2015-2015
 * @license        MIT
 */

const path       = require('path')
const CatLog = require('cat-log')
const log = new CatLog('adonis:framework')

let rootPath     = null     // application root path
let appPath      = null     // path to application app directory
let appNameSpace = null     // autoloading namespace

/*jshint -W120 */
let Helpers = exports = module.exports = {}

/**
 * loads package.json file from application and set required paths
 * and namespace based on same.
 * --------------------------------------------------------------------
 * @param    |    {String}    |    packagePath
 * @param    |    {Object}    |    Ioc
 * @return   |    {void}
 * @public
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
  if(Ioc && Ioc.autoload) {
    Ioc.autoload(appNameSpace, appPath)
  }
}

/**
 * Returns path to application root.
 * -----------------------------------------------------------
 * @return    |    {String}
 * @public
 */
Helpers.basePath = function () {
  return rootPath
}

/**
 * Returns path to application folder which is
 * defined under a given namespace.
 * -----------------------------------------------------------
 * @return    |    {String}
 * @public
 */
Helpers.appPath = function () {
  return appPath
}

/**
 * Returns path to application public folder
 * -----------------------------------------------------------
 * @return    |    {String}
 * @public
 */
Helpers.publicPath = function (toFile) {
  const toDir = './public'
  const incrementalPath = typeof (toFile) !== 'undefined' ? `/${toDir}/${toFile}` : toDir
  return Helpers._makePath(rootPath, incrementalPath)
}

/**
 * Returns application namespace , under which
 * app directory is registered.
 * -----------------------------------------------------------
 * @return    |    {String}
 * @public
 */
Helpers.appNameSpace = function () {
  return appNameSpace
}

/**
 * returns path to config directory
 * -----------------------------------------------------------
 * @return    |    {String}
 * @public
 */
Helpers.configPath = function (toFile) {
  const toDir = './config'
  const incrementalPath = typeof (toFile) !== 'undefined' ? `/${toDir}/${toFile}` : toDir
  return Helpers._makePath(rootPath, incrementalPath)
}

/**
 * returns reference to storage path of application
 * -----------------------------------------------------------
 * @return    |    {String}
 * @public
 */
Helpers.storagePath = function (toFile) {
  const toDir = './storage'
  const incrementalPath = typeof (toFile) !== 'undefined' ? `/${toDir}/${toFile}` : toDir
  return Helpers._makePath(rootPath, incrementalPath)
}

/**
 * returns reference to resources directory
 * -----------------------------------------------------------
 * @return    |    {String}
 * @public
 */
Helpers.resourcesPath = function (toFile) {
  const toDir = './resources'
  const incrementalPath = typeof (toFile) !== 'undefined' ? `/${toDir}/${toFile}` : toDir
  return Helpers._makePath(rootPath, incrementalPath)
}

/**
 * returns path to migrations directory.
 * -----------------------------------------------------------
 * @param     |    {String}    |    toFile
 * @return    |    {String}    |
 */
Helpers.migrationsPath = function (toFile) {
  const toDir = './migrations'
  const incrementalPath = typeof (toFile) !== 'undefined' ? `/${toDir}/${toFile}` : toDir
  return Helpers._makePath(rootPath, incrementalPath)
}

/**
 * returns reference to views directory
 * -----------------------------------------------------------
 * @return    |    {String}    |
 */
Helpers.viewsPath = function () {
  return Helpers.resourcesPath('views')
}

/**
 * makes path by joining two endpoints
 * -----------------------------------------------------------
 * @param     |    {String}    |    base
 * @param     |    {String}    |    incremental
 * @return    |    {String}    |
 * @private
 */
Helpers._makePath = function (base, incremental) {
  return path.join(base, incremental)
}
