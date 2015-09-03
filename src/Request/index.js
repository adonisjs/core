'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Adds glue to http req object by providing convience methods
 */

const querystring = require('querystring')
const parseurl = require('parseurl')
const requestIp = require('request-ip')
const _ = require('lodash')
const helpers = require('./helpers')
const cookie = require('cookie')

/**
 * Request class
 * @param {Object} req
 * @constructor
 */
function Request (req) {
  this.request = req
}

/**
 * returning query string values from request as object
 * @return {Object}
 */
Request.prototype.get = function () {
  return querystring.parse(parseurl(this.request).query)
}

/**
 * returning route params
 * @return {Object}
 */
Request.prototype.params = function () {
  return this.request.params || {}
}

/**
 * returning route param value based on input key
 * @return {Object}
 */
Request.prototype.param = function (key, defaultValue) {
  defaultValue = defaultValue || null
  return this.params()[key] || defaultValue
}

/**
 * return post values from request as object
 * @return {Object}
 */
Request.prototype.post = function () {
  return this.body
}

/**
 * return uploaded files from request
 * @return {Object}
 */
Request.prototype.files = function () {
  const self = this
  const returnData = {}
  _.each(this.uploadedFiles, function (value, index) {
    returnData[index] = self.file(index)
  })
  return returnData
}

/**
 * return uploaded file for a given key from request
 * @return {Object}
 */
Request.prototype.file = function (key) {
  if (!this.uploadedFiles[key]) {
    return helpers.convert_to_file_instance({})
  }
  let fileToReturn = this.uploadedFiles[key].toJSON()

  if (_.isArray(fileToReturn)) {
    fileToReturn = _.map(fileToReturn, function (file) {
      return helpers.convert_to_file_instance(file)
    })
    return fileToReturn
  } else {
    fileToReturn = helpers.convert_to_file_instance(fileToReturn)
    return fileToReturn
  }
}

/**
 * return value for a given key from all method
 * @return {Object}
 */
Request.prototype.input = function (key, defaultValue) {
  defaultValue = defaultValue || null
  return this.all()[key] || defaultValue
}

/**
 * merge get and post values and return them together
 * @return {Object}
 */
Request.prototype.all = function () {
  let body = this.post()
  let query = this.get()
  return _.merge(query, body)
}

/**
 * return only request keys from values returned from all method
 * @return {Object}
 */
Request.prototype.only = function () {
  let all = this.all()
  return helpers.return_requested_keys_from_object(all, arguments)
}

/**
 * return all values from all method except defined keys
 * @return {Object}
 */
Request.prototype.except = function () {
  let all = this.all()
  return helpers.remove_requested_keys_from_object(all, arguments)
}

/**
 * returns a selected header key from headers object
 * @param  {String} key
 * @param  {*} defaultValue
 * @return {*}
 */
Request.prototype.header = function (key, defaultValue) {
  defaultValue = defaultValue || null
  return this.headers()[key] || defaultValue
}

/**
 * return request headers
 * @return {Object}
 */
Request.prototype.headers = function () {
  return this.request.headers || {}
}

/**
 * return request path
 * @return {String}
 */
Request.prototype.path = function () {
  return parseurl(this.request).pathname
}

/**
 * return request method/verb
 * @return {String}
 */
Request.prototype.method = function () {
  return this.request.method
}

/**
 * tell whether request is ajaxed or not
 * @return {Boolean}
 */
Request.prototype.ajax = function () {
  let xmlHeader = this.header('x-requested-with')
  return xmlHeader === 'XMLHttpRequest'
}

/**
 * tell whether request is pjax or not
 * @return {Boolean}
 */
Request.prototype.pjax = function () {
  let pjaxHeader = this.header('x-pjax')
  return pjaxHeader
}

/**
 * return request ip address
 * @return {String}
 */
Request.prototype.ip = function () {
  return requestIp.getClientIp(this.request)
}

/**
 * returns best possible return type for a request
 * @return {String}
 */
Request.prototype.accepts = function () {
  return helpers.check_http_accept_field(this.request, _.toArray(arguments))
}

/**
 * tells whether request content-type falls in required typed
 * @return {Boolean} [description]
 */
Request.prototype.is = function () {
  return helpers.check_http_content_type(this.request, _.toArray(arguments))
}

/**
 * returns cookie value corresponding to a given key
 * @param  {String} key
 * @param  {*} defaultValue
 * @return {*}
 */
Request.prototype.cookie = function (key, defaultValue) {
  defaultValue = defaultValue || null
  return this.cookies()[key] || defaultValue
}

/**
 * return request cookies
 * @return {Object}
 */
Request.prototype.cookies = function () {
  if (!this.request.headers.cookie) {
    return {}
  }
  return cookie.parse(this.request.headers.cookie)
}

module.exports = Request
