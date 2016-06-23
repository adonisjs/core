'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const fs = require('fs')
const mkdirp = require('mkdirp')

/**
 * File driver to session provider, to save sessions
 * inside a file
 * @class
 * @alias SessionFileDriver
 */
class File {

  constructor (Helpers, Config) {
    const sessionDir = Config.get('sessions.file.directory') || 'sessions/'
    this.storagePath = Helpers.storagePath(sessionDir)
    this.config = Config
  }

  /**
   * write file to disk for a given session
   * and session data
   *
   * @param  {String}            filePath
   * @param  {String}            data
   * @return {void}
   *
   * @private
   */
  _writeSessionToFile (filePath, data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, data, (err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  /**
   * ensures storage directory by creating
   * it or using previously created one.
   *
   * @param  {String}        storagePath
   * @return {void}
   *
   * @private
   */
  _makeStorageDir (storagePath) {
    return new Promise((resolve, reject) => {
      mkdirp(storagePath, (err) => {
        /* istanbul ignore if */
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  /**
   * reads a given file and returning
   * back into valid promise
   *
   * @param {String} filePath
   * @return {Mixed}
   *
   * @private
   */
  _readSession (filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, contents) => {
        if (err) {
          reject(err)
        }
        resolve(contents.toString('utf8'))
      })
    })
  }

  /**
   * writes session data to disk
   *
   * @param  {String} sessionId
   * @param  {String} data
   *
   * @example
   * yield fileDriver.write(sessionId, values)
   *
   * @public
   */
  * write (sessionId, data) {
    yield this._makeStorageDir(this.storagePath)
    const sessionFile = `${this.storagePath}/${sessionId}`
    yield this._writeSessionToFile(sessionFile, data)
  }

  /**
   * reads session value for a given
   * sessionId
   *
   * @param  {String} sessionId
   * @return {Object}
   *
   * @example
   * yield fileDriver.read(sessionId)
   *
   * @public
   */
  * read (sessionId) {
    try {
      const sessionFile = `${this.storagePath}/${sessionId}`
      const sessionData = yield this._readSession(sessionFile)
      return JSON.parse(sessionData)
    } catch (e) {
      return {}
    }
  }

}

module.exports = File
