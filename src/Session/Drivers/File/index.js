'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const fs = require('co-fs-extra')

/**
 * File driver to session provider, to save sessions
 * inside a file
 * @class
 * @alias SessionFileDriver
 */
class File {

  /**
   * Injects ['Adonis/Src/Helpers', 'Adonis/Src/Config']
   */
  static get inject () {
    return ['Adonis/Src/Helpers', 'Adonis/Src/Config']
  }

  /**
   * @constructor
   */
  constructor (Helpers, Config) {
    const sessionDir = Config.get('session.file.directory') || 'sessions/'
    this.sessionPath = Helpers.storagePath(sessionDir)
    this.config = Config
  }

  /**
   * writes session data to disk
   *
   * @param  {String} sessionId
   *
   * @param  {String} data
   *
   * @example
   * yield fileDriver.write(sessionId, values)
   */
  * write (sessionId, data) {
    const sessionFile = `${this.sessionPath}/${sessionId}`
    yield fs.ensureFile(sessionFile)
    yield fs.writeJson(sessionFile, data, {spaces: 2})
  }

  /**
   * reads session value for a given
   * sessionId
   *
   * @param  {String} sessionId
   *
   * @return {Object}
   *
   * @example
   * yield fileDriver.read(sessionId)
   */
  * read (sessionId) {
    try {
      const sessionFile = `${this.sessionPath}/${sessionId}`
      return yield fs.readJson(sessionFile)
    } catch (e) {
      return {}
    }
  }

  /**
   * removes a session file
   *
   * @param  {String} sessionId
   *
   * @return {void}
   */
  * destroy (sessionId) {
    const sessionFile = `${this.sessionPath}/${sessionId}`
    return yield fs.remove(sessionFile)
  }
}

module.exports = File
