'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-http-dispatcher
 * @description - File class to add helpers methods on top of uploaded file
 */

const path = require('path')
const fsExtra = require('co-fs-extra')
const mime = require('mime')

function File (file) {
  this.file = file
}

/**
 * move file to a given destination inside
 * registered public directory
 * @param {String} toPath
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
 * returns mime type for uploaded file
 * @return {String}
 */
File.prototype.mimeType = function () {
  return this.file['type']
}

/**
 * returns file extension
 * @return {String}
 */
File.prototype.extension = function () {
  return path.extname(this.clientName()).replace('.', '')
}

/**
 * returns client name for uploaded file
 * @return {String}
 */
File.prototype.clientName = function () {
  return this.file['name']
}

/**
 * returns client size for uploaded file
 * @return {String}
 */
File.prototype.clientSize = function () {
  return this.file['size']
}

/**
 * returns temporary path for a given file
 * @return {String}
 */
File.prototype.tmpPath = function () {
  return this.file['path']
}

/**
 * returns uploaded name for file after file has
 * been moved
 * @return {String}
 */
File.prototype.uploadName = function () {
  return this.file['filename']
}

/**
 * returns uploaded path for file after file has
 * been moved
 * @return {String}
 */
File.prototype.uploadPath = function () {
  return this.file['filepath']
}

/**
 * returns whether file exsits or not
 * @return {Boolean}
 */
File.prototype.exists = function () {
  return !!this.tmpPath()
}

/**
 * tells whether file has been moved successfully or not
 * @return {Boolean}
 */
File.prototype.moved = function () {
  return !this.errors()
}

/**
 * returns upload errors if any
 * @return {Object}
 */
File.prototype.errors = function () {
  return this.file.error || null
}

module.exports = File
