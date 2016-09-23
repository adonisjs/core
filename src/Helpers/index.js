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
const _ = require('lodash')
const CatLog = require('cat-log')
const log = new CatLog('adonis:framework')
const NE = require('node-exceptions')

let rootPath = '' // application root path
let autoloadNameSpace = '' // autoloading namespace | required for backword compatibility

/**
 * path to base directories with relative
 * paths from the project root.
 *
 * @type {Object}
 */
let originalProjectDirectories = {
  public: 'public',
  storage: 'storage',
  database: 'database',
  resources: 'resources',
  config: 'config',
  app: 'app'
}

/**
 * cloning over original app directories so that orignal
 * reset method should be able to restore it.
 *
 * @type {Object}
 */
let projectDirectories = _.clone(originalProjectDirectories)

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
  Helpers.reset() // reset itself before start
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
  Helpers.setProjectDirectory('app', packageFile.autoload[autoloadNameSpace])
  if (Ioc && Ioc.autoload) {
    Ioc.autoload(autoloadNameSpace, path.join(rootPath, projectDirectories.app))
  }
}

/**
 * the load method to be shipped with 3.1
 *
 * @param  {String} appRoot
 *
 * @public
 */
Helpers.loadInFuture = function (appRoot) {
  rootPath = appRoot
}

/**
 * reset helpers state back to original
 *
 * @public
 */
Helpers.reset = function () {
  projectDirectories = _.clone(originalProjectDirectories)
  rootPath = null
  autoloadNameSpace = null
}

/**
 * returns the current mapping of directories
 *
 * @return {Object}
 *
 * @public
 */
Helpers.getProjectDirectories = function () {
  return projectDirectories
}

/**
 * overrides the current mapping of directories
 *
 * @param  {Object} directories
 *
 * @public
 */
Helpers.setProjectDirectories = function (directories) {
  projectDirectories = directories
}

/**
 * overrides a give mapping of directories.
 *
 * @param  {String} name
 * @param  {String} toPath
 *
 * @public
 */
Helpers.setProjectDirectory = function (name, toPath) {
  projectDirectories[name] = toPath
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
  const toDir = projectDirectories.app
  return Helpers._makePath(rootPath, toDir)
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
  const toDir = projectDirectories.public
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
  const toDir = projectDirectories.config
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
  const toDir = projectDirectories.storage
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
  const toDir = projectDirectories.resources
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
  const toDir = projectDirectories.database
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
  toDir = path.isAbsolute(toDir) ? toDir : path.join(base, toDir)
  return toFile ? path.join(toDir, toFile) : toDir
}
