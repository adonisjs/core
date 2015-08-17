'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-http-dispatcher
 * @description - File class to add helpers methods on top of uploaded file
 */

const path = require('path')
const fsExtra = require('co-fs-extra')

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
    yield fsExtra.copy(self.file.path, uploadingFileName)
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
