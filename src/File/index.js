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
const bytes = require('bytes')

/**
 * Used by request object internally to manage file uploads.
 *
 * @class
 *
 * @alias Request.file
 */
class File {

  constructor (formidableObject, options) {
    options = options || {}
    this.file = formidableObject
    this.file.error = null
    this.file.fileName = ''
    this.file.maxSize = options.maxSize ? bytes(options.maxSize) : null
    this.file.allowedExtensions = options.allowedExtensions || []
    this.file.filePath = ''
  }

  /**
   * sets error on the file instance and clears
   * the file name and path
   *
   * @param   {String} error
   *
   * @private
   */
  _setError (error) {
    this.file.error = error
    this.file.fileName = ''
    this.file.filePath = ''
  }

  /**
   * sets filePath and name after the move
   * and clears the error.
   *
   * @param   {String} fileName
   * @param   {String} filePath
   *
   * @private
   */
  _setUploadedFile (fileName, filePath) {
    this.file.error = null
    this.file.fileName = fileName
    this.file.filePath = filePath
  }

  /**
   * sets file size exceeds error
   *
   * @private
   */
  _setFileSizeExceedsError () {
    this._setError(`Uploaded file size ${bytes(this.clientSize())} exceeds the limit of ${bytes(this.file.maxSize)}`)
  }

  /**
   * sets file size extension error
   *
   * @private
   */
  _setFileExtensionError () {
    this._setError(`Uploaded file extension ${this.extension()} is not valid`)
  }

  /**
   * validates the file size
   *
   * @return  {Boolean}
   *
   * @private
   */
  _underAllowedSize () {
    return !this.file.maxSize || (this.clientSize() <= this.file.maxSize)
  }

  /**
   * returns whether file has one of the defined extension
   * or not.
   *
   * @return  {Boolean} [description]
   *
   * @private
   */
  _hasValidExtension () {
    return !this.file.allowedExtensions.length || this.file.allowedExtensions.indexOf(this.extension()) > -1
  }

  /**
   * a method to validate a given file.
   *
   * @return {Boolean}
   */
  validate () {
    if (!this._hasValidExtension()) {
      this._setFileExtensionError()
      return false
    } else if (!this._underAllowedSize()) {
      this._setFileSizeExceedsError()
      return false
    }
    return true
  }

  /**
   * validates the file size and move it to the destination
   *
   * @param   {String} fileName
   * @param   {String} completePath
   *
   * @return  {Promise}
   *
   * @private
   */
  _validateAndMove (fileName, completePath) {
    return new Promise((resolve) => {
      if (!this.validate()) {
        resolve()
        return
      }
      fs.rename(this.tmpPath(), completePath, (error) => {
        error ? this._setError(error) : this._setUploadedFile(fileName, completePath)
        resolve()
      })
    })
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
    return this._validateAndMove(name, uploadingFileName)
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
    return this.file.fileName
  }

  /**
   * returns complete uploadPath after moving file
   *
   * @return {String}
   *
   * @public
   */
  uploadPath () {
    return this.file.filePath
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

  /**
   * returns the JSON representation of the
   * file instance.
   *
   * @return {Object}
   *
   * @public
   */
  toJSON () {
    return this.file
  }

}

module.exports = File
