'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const fs = require('fs')
const mkdirp = require('mkdirp')

/**
 * @class  File
 * @description File driver for session provider
 */
class File {

  constructor (Helpers, Config) {
    const sessionDir = Config.get('sessions.file.directory') || 'sessions/'
    this.storagePath = Helpers.storagePath(sessionDir)
    this.config = Config
  }

  /**
   * @description write file to disk for a given session
   * and session data
   * @method _writeSessionToFile
   * @param  {String}            filePath
   * @param  {String}            data
   * @return {void}
   * @private
   */
  _writeSessionToFile (filePath, data) {
    return new Promise(function (resolve, reject) {
      fs.writeFile(filePath, data, function (err) {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  /**
   * @description ensures storage directory by creating
   * it or using previously created one.
   * @method _makeStorageDir
   * @param  {String}        storagePath
   * @return {void}
   * @private
   */
  _makeStorageDir (storagePath) {
    return new Promise(function (resolve, reject) {
      mkdirp(storagePath, function (err) {
        /* istanbul ignore if */
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  /**
   * @description reads a given file and returning
   * back into valid promise
   * @method _readSession
   * @param {String} filePath
   * @return {Mixed}
   */
  _readSession (filePath) {
    return new Promise(function (resolve, reject) {
      fs.readFile(filePath, function (err, contents) {
        if (err) {
          return reject(err)
        }
        resolve(contents.toString('utf8'))
      })
    })
  }

  /**
   * @description writes session data to disk
   * @method write
   * @param  {String} sessionId
   * @param  {String} data
   * @return {void}
   * @public
   */
  * write (sessionId, data) {
    yield this._makeStorageDir(this.storagePath)
    const sessionFile = `${this.storagePath}/${sessionId}`
    yield this._writeSessionToFile(sessionFile, data)
  }

  /**
   * @description reads session value for a given
   * sessionId
   * @method read
   * @param  {String} sessionId
   * @return {Object}
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
