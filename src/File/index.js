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
const fs = require('fs')

/**
 * Used by request object internally to manage file uploads.
 *
 * @class
 *
 * @alias Request.file
 */
class File {

  constructor (formidableObject) {
    this.file = formidableObject
    this.file.error = null
    this.file.filename = ''
    this.file.filepath = ''
  }

  /**
   * moves uploaded file from tmpPath to a given location. This is
   * an async function.
   *
   * @param  {String} toPath
   * @param  {String} name
   *
   * @example
   * yield file.move()
   *
   * @public
   */
  move (toPath, name) {
    name = name || this.clientName()
    const uploadingFileName = `${toPath}/${name}`
    return new Promise((resolve) => {
      fs.rename(this.tmpPath(), uploadingFileName, (err) => {
        if (err) {
          this.file.error = err
          this.file.filename = ''
          this.file.filepath = ''
        } else {
          this.file.error = null
          this.file.filename = name
          this.file.filepath = uploadingFileName
        }
        resolve()
      })
    })
  }

  /**
   * returns name of the uploaded file inside tmpPath.
   *
   * @return {String}
   *
   * @public
   */
  clientName () {
    return this.file.name
  }

  /**
   * returns file mime type detected from original uploaded file.
   *
   * @return {String}
   *
   * @public
   */
  mimeType () {
    return this.file.type
  }

  /**
   * returns file extension from original uploaded file.
   *
   * @return {String}
   *
   * @public
   */
  extension () {
    return path.extname(this.clientName()).replace('.', '')
  }

  /**
   * returns file size of original uploaded file.
   *
   * @return {String}
   *
   * @public
   */
  clientSize () {
    return this.file.size
  }

  /**
   * returns temporary path of file.
   *
   * @return {String}
   *
   * @public
   */
  tmpPath () {
    return this.file.path
  }

  /**
   * returns file name after moving file
   *
   * @return {String}
   *
   * @public
   */
  uploadName () {
    return this.file.filename
  }

  /**
   * returns complete uploadPath after moving file
   *
   * @return {String}
   *
   * @public
   */
  uploadPath () {
    return this.file.filepath
  }

  /**
   * tells whether file exists on temporary path or not
   *
   * @return {Boolean}
   *
   * @public
   */
  exists () {
    return !!this.tmpPath()
  }

  /**
   * tells whether move operation was successful or not
   *
   * @return {Boolean}
   *
   * @public
   */
  moved () {
    return !this.errors()
  }

  /**
   * returns errors caused while moving file
   *
   * @return {Object}
   *
   * @public
   */
  errors () {
    return this.file.error
  }

}

module.exports = File
