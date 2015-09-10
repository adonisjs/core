'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const path = require('path')
const fsExtra = require('co-fs-extra')
const mime = require('mime')

function File (file) {
  this.file = file
}

/**
 * @function move
 * @description move file to a given destination inside
 * registered public directory
 * @param {String} toPath
 * @public
 */
File.prototype.move = function * (toPath, name) {
  let self = this
  name = name || this.clientName()
  const uploadingFileName = `${toPath}/${name}`
  try {
    yield fsExtra.move(self.file.path, uploadingFileName)
    self.file.filename = name
    self.file.mime = mime.lookup(uploadingFileName)
    self.file.filepath = uploadingFileName
  } catch (e) {
    self.file.error = e
  }
}

/**
 * @function mimeType
 * @description returns mime type for uploaded file
 * @return {String}
 * @public
 */
File.prototype.mimeType = function () {
  return this.file['type']
}

/**
 * @function extension
 * @description returns file extension
 * @return {String}
 * @public
 */
File.prototype.extension = function () {
  return path.extname(this.clientName()).replace('.', '')
}

/**
 * @function clientName
 * @description returns client name for uploaded file
 * @return {String}
 * @public
 */
File.prototype.clientName = function () {
  return this.file['name']
}

/**
 * @function clientSize
 * @description returns client size for uploaded file
 * @return {String}
 * @public
 */
File.prototype.clientSize = function () {
  return this.file['size']
}

/**
 * @function tmpPath
 * @description returns temporary path for a given file
 * @return {String}
 * @public
 */
File.prototype.tmpPath = function () {
  return this.file['path']
}

/**
 * @function uploadName
 * @description returns uploaded name for file after file has
 * been moved
 * @return {String}
 * @public
 */
File.prototype.uploadName = function () {
  return this.file['filename']
}

/**
 * @function uploadPath
 * @description returns uploaded path for file after file has
 * been moved
 * @return {String}
 * @public
 */
File.prototype.uploadPath = function () {
  return this.file['filepath']
}

/**
 * @function exists
 * @description returns whether file exsits or not
 * @return {Boolean}
 * @public
 */
File.prototype.exists = function () {
  return !!this.tmpPath()
}

/**
 * @function moved
 * @description tells whether file has been moved successfully or not
 * @return {Boolean}
 * @public
 */
File.prototype.moved = function () {
  return !this.errors()
}

/**
 * @function errors
 * @description returns upload errors if any
 * @return {Object}
 * @public
 */
File.prototype.errors = function () {
  return this.file.error || null
}

module.exports = File
