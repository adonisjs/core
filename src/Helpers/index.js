'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')

/**
 * This class returns absolute path to commonly
 * used AdonisJs directories.
 *
 * @class Helpers
 * @constructor
 */
class Helpers {
  constructor (appRoot) {
    this._appRoot = appRoot
  }

  /**
   * Returns path to the public directory or a
   * specific file to the public directory.
   *
   * ## Note
   * This method does not check the existence of
   * file.
   *
   * @method publicPath
   *
   * @param  {String}   [toFile = '']
   *
   * @return {String}
   */
  publicPath (toFile = '') {
    return path.join(this._appRoot, '/public', toFile)
  }

  /**
   * Returns path to the config directory.
   *
   * ## Note
   * This method does not check the existence of
   * file.
   *
   * @method configPath
   *
   * @return {String}
   */
  configPath () {
    if (arguments[0]) {
      throw new Error('You should never read a config file from the config directory and instead use config provider.')
    }
    return path.join(this._appRoot, '/config')
  }

  /**
   * Returns path to the resources directory or a
   * specific file to the resources directory.
   *
   * ## Note
   * This method does not check the existence of
   * file.
   *
   * @method resourcesPath
   *
   * @param  {String}   [toFile = '']
   *
   * @return {String}
   */
  resourcesPath (toFile = '') {
    return path.join(this._appRoot, '/resources', toFile)
  }

  /**
   * Returns path to the views directory or a
   * specific file to the views directory.
   *
   * ## Note
   * This method does not check the existence of
   * file.
   *
   * @method viewsPath
   *
   * @param  {String}   [toFile = '']
   *
   * @return {String}
   */
  viewsPath (toFile = '') {
    return path.join(this._appRoot, '/resources/views', toFile)
  }

  /**
   * Returns path to the database directory or a
   * specific file to the database directory.
   *
   * ## Note
   * This method does not check the existence of
   * file.
   *
   * @method databasePath
   *
   * @param  {String}   [toFile = '']
   *
   * @return {String}
   */
  databasePath (toFile = '') {
    return path.join(this._appRoot, '/database', toFile)
  }

  /**
   * Returns path to the migrations directory or a
   * specific file to the migrations directory.
   *
   * ## Note
   * This method does not check the existence of
   * file.
   *
   * @method migrationsPath
   *
   * @param  {String}   [toFile = '']
   *
   * @return {String}
   */
  migrationsPath (toFile = '') {
    return path.join(this._appRoot, '/database/migrations', toFile)
  }

  /**
   * Returns path to the seeds directory or a
   * specific file to the seeds directory.
   *
   * ## Note
   * This method does not check the existence of
   * file.
   *
   * @method seedsPath
   *
   * @param  {String}   [toFile = '']
   *
   * @return {String}
   */
  seedsPath (toFile = '') {
    return path.join(this._appRoot, '/database/seeds', toFile)
  }

  /**
   * Returns path to the tmp directory or a
   * specific file to the tmp directory.
   *
   * ## Note
   * This method does not check the existence of
   * file.
   *
   * @method tmpPath
   *
   * @param  {String}   [toFile = '']
   *
   * @return {String}
   */
  tmpPath (toFile = '') {
    return path.join(this._appRoot, '/tmp', toFile)
  }
}

module.exports = Helpers
