'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const _ = require('lodash')
const accepts = require('accepts')
const is = require('type-is')
const File = require('../File')

let RequestHelpers = exports = module.exports = {}

/**
 * @function returnRequestKeysFromObject
 * @description return values from object based upon requested keys
 * @param  {Object} hash
 * @param  {Array} keys
 * @return {Object}
 * @public
 */
RequestHelpers.returnRequestKeysFromObject = function (hash, keys) {
  /**
   * if there aren't any request keys , return the hash back
   */
  if (_.size(keys) === 0) {
    return hash
  }

  let filteredValues = {}
  _.each(keys, function (arg) {
    if (!hash[arg]) hash[arg] = null
    filteredValues[arg] = hash[arg]
  })
  return filteredValues
}

/**
 * @function removeRequestedKeysFromObject
 * @description remove request keys from object and return
 * remaining keys/values pair
 * @param  {Object} hash
 * @param  {Array} keys
 * @return {Object}
 * @public
 */
RequestHelpers.removeRequestedKeysFromObject = function (hash, keys) {
  if (_.size(keys) === 0) {
    return hash
  }
  return _.omit(hash, keys)
}

/**
 * @function checkHttpAcceptField
 * checks best possible return type for a request
 * @param  {Object} req
 * @param  {Array} types
 * @return {String}
 * @public
 */
RequestHelpers.checkHttpAcceptField = function (req, types) {
  let accept = accepts(req)
  return accept.type(types)
}

/**
 * @function checkHttpContentType
 * @description check request content-type header
 * @param  {Object} req
 * @param  {Array} types
 * @return {String}
 * @public
 */
RequestHelpers.checkHttpContentType = function (req, types) {
  return is.is(req, types)
}

/**
 * @function convertToFileInstance
 * @description converting file object to a file instance.
 * @param  {Object} file
 * @return {Object}      instance of file class
 * @public
 */
RequestHelpers.convertToFileInstance = function (file) {
  if (!(file instanceof File)) {
    file = new File(file)
  }
  return file
}
