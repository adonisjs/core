'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')
const CatLog = require('cat-log')
const log = new CatLog('adonis:framework')
const NE = require('node-exceptions')

let rootPath = '' // application root path
let appPath = '' // path to application app directory
let autoloadNameSpace = '' // autoloading namespace

/**
 * Manage commonly required methods to be used anywhere inside
 * the application
 * @module Helpers
 */
let Helpers = exports = module.exports = {}

/**
 * loads package.json file from application and set required paths
 * and namespace based on same.
 *
 * @method load
 *
 * @param  {String} packagePath
 * @param  {Object} Ioc
 *
 * @throws {DomainException} If autoload is not defined in package.json file
 *
 * @public
 */
Helpers.load = function (packagePath, Ioc) {
  log.verbose('reading autoload settings from %s', packagePath)

  rootPath = path.dirname(packagePath)

  const packageFile = require(packagePath)
  if (!packageFile.autoload) {
    throw new NE.DomainException('autoload must be enable inside package.json file')
  }

  const autoloadSettings = Object.keys(packageFile.autoload)
  if (!autoloadSettings.length) {
    throw new NE.DomainException('autoload must be enable inside package.json file')
  }

  autoloadNameSpace = autoloadSettings[0]
  appPath = path.join(rootPath, packageFile.autoload[autoloadNameSpace])

  if (Ioc && Ioc.autoload) {
    Ioc.autoload(autoloadNameSpace, appPath)
  }
}

/**
 * Returns absolute path to application root
 *
 * @method basePath
 *
 * @return {String}
 */
Helpers.basePath = function () {
  return rootPath
}

/**
 * Returns absolute path to application folder which is
 * defined under a given namespace.
 *
 * @method appPath
 *
 * @return {String}
 */
Helpers.appPath = function () {
  return appPath
}

/**
 * Returns absolute path to application public folder or path to a
 * given file inside public folder.
 *
 * @method publicPath
 *
 * @param  {String}   [toFile] - filename to return path for
 * @return {String}
 */
Helpers.publicPath = function (toFile) {
  const toDir = './public'
  return Helpers._makePath(rootPath, toDir, toFile)
}

/**
 * Returns application namespace , under which
 * app directory is registered.
 *
 * @method appNameSpace
 *
 * @return {String}
 */
Helpers.appNameSpace = function () {
  return autoloadNameSpace
}

/**
 * makes complete namespace for a given path and base
 * namespace
 *
 * @method makeNameSpace
 *
 * @param  {String}      baseNameSpace
 * @param  {String}      toPath
 * @return {String}
 *
 * @public
 */
Helpers.makeNameSpace = function (baseNameSpace, toPath) {
  const appNameSpace = Helpers.appNameSpace()
  if (toPath.startsWith(appNameSpace)) {
    return toPath
  }
  return path.normalize(`${appNameSpace}/${baseNameSpace}/${toPath}`)
}

/**
 * returns absolute path to config directory or a file inside
 * config directory
 *
 * @method configPath
 *
 * @param  {String}   [toFile] - filename to return path for
 * @return {String}
 */
Helpers.configPath = function (toFile) {
  const toDir = './config'
  return Helpers._makePath(rootPath, toDir, toFile)
}

/**
 * returns absolute path to storage path of application or an
 * file inside the storage path.
 *
 * @method storagePath
 *
 * @param  {String}   [toFile] - filename to return path for
 * @return {String}
 *
 * @public
 */
Helpers.storagePath = function (toFile) {
  const toDir = './storage'
  return Helpers._makePath(rootPath, toDir, toFile)
}

/**
 * returns absolute path to resources directory or a file inside
 * resources directory
 *
 * @method resourcesPath
 *
 * @param  {String}   [toFile] - filename to return path for
 * @return {String}
 *
 * @public
 */
Helpers.resourcesPath = function (toFile) {
  const toDir = './resources'
  return Helpers._makePath(rootPath, toDir, toFile)
}

/**
 * returns absolute path to database/migrations directory.
 *
 * @method migrationsPath
 *
 * @param  {String}   [toFile] - filename to return path for
 * @return {String}
 *
 * @public
 */
Helpers.migrationsPath = function (toFile) {
  const toDir = toFile ? `./migrations/${toFile}` : './migrations'
  return Helpers.databasePath(toDir)
}

/**
 * returns absolute path to database/seeds directory.
 *
 * @method seedsPath
 *
 * @param  {String}   [toFile] - filename to return path for
 * @return {String}
 *
 * @public
 */
Helpers.seedsPath = function (toFile) {
  const toDir = toFile ? `./seeds/${toFile}` : './seeds'
  return Helpers.databasePath(toDir)
}

/**
 * returns absolute path to database/factories directory.
 *
 * @method factoriesPath
 *
 * @param  {String}   [toFile] - filename to return path for
 * @return {String}
 *
 * @public
 */
Helpers.factoriesPath = function (toFile) {
  const toDir = toFile ? `./factories/${toFile}` : './factories'
  return Helpers.databasePath(toDir)
}

/**
 * returns path to the database directory.
 *
 * @method databasePath
 *
 * @param  {String}     toFile
 * @return {String}
 *
 * @public
 */
Helpers.databasePath = function (toFile) {
  const toDir = './database'
  return Helpers._makePath(rootPath, toDir, toFile)
}

/**
 * returns whether the process belongs to ace command
 * or not.
 *
 * @method isAceCommand
 *
 * @return {Boolean}
 *
 * @public
 */
Helpers.isAceCommand = function () {
  const processFile = process.mainModule.filename
  return processFile.endsWith('ace')
}

/**
 * returns absolute path to views directory
 *
 * @method viewsPath
 *
 * @return {String}
 *
 * @public
 */
Helpers.viewsPath = function () {
  return Helpers.resourcesPath('views')
}

/**
 * makes path by joining two endpoints
 *
 * @method _makePath
 *
 * @param  {String}  base
 * @param  {String}  toDir
 * @param  {String}  toFile
 * @return {String}
 *
 * @private
 */
Helpers._makePath = function (base, toDir, toFile) {
  const incremental = toFile ? `/${toDir}/${toFile}` : toDir
  return path.join(base, incremental)
}
