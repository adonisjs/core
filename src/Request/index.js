'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const querystring = require('querystring')
const parseurl = require('parseurl')
const requestIp = require('request-ip')
const _ = require('lodash')
const helpers = require('./helpers')
const Cookies = require('../Cookies')
const contentType = require('content-type')

/**
 * Request class
 * @param {Object} req
 * @constructor
 */
function Request (req) {
  this.request = req
}

/**
 * @function get
 * @description returning query string values from request as object
 * @return {Object}
 * @public
 */
Request.prototype.get = function () {
  return querystring.parse(parseurl(this.request).query)
}

/**
 * @function params
 * @description returning dynamic route parameters defined while
 * defining routes
 * @return {Object}
 * @public
 */
Request.prototype.params = function () {
  return this.request.params || {}
}

/**
 * @function param
 * @description returning route param value based on input key
 * @param {String} key
 * @param {*} defaultValue
 * @return {*}
 * @public
 */
Request.prototype.param = function (key, defaultValue) {
  defaultValue = defaultValue || null
  return this.params()[key] || defaultValue
}

/**
 * @function post
 * @description return post values from request as object
 * @return {Object}
 * @public
 */
Request.prototype.post = function () {
  return this.body
}

/**
 * @function post
 * @description return request raw body
 * @return {*}
 * @public
 */
Request.prototype.raw = function () {
  return this.rawBody
}

/**
 * @function files
 * @description returning uploaded files via
 * multipart/form-date , each file will be
 * an instance of file class.
 * @return {Object}
 * @public
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
 * @function file
 * @description return uploaded file for a given key from request
 * @param {String} key
 * @return {Object}
 * @public
 */
Request.prototype.file = function (key) {
  if (!this.uploadedFiles[key]) {
    return helpers.convertToFileInstance({})
  }
  let fileToReturn = this.uploadedFiles[key].toJSON()

  if (_.isArray(fileToReturn)) {
    fileToReturn = _.map(fileToReturn, function (file) {
      return helpers.convertToFileInstance(file)
    })
    return fileToReturn
  } else {
    fileToReturn = helpers.convertToFileInstance(fileToReturn)
    return fileToReturn
  }
}

/**
 * @function input
 * @description return value for a given key from all method
 * @param {String} key
 * @param {*} defaultValue
 * @return {*}
 * @public
 */
Request.prototype.input = function (key, defaultValue) {
  defaultValue = defaultValue || null
  return this.all()[key] || defaultValue
}

/**
 * @function all
 * @description merge get and post values and return them together
 * @return {Object}
 * @public
 */
Request.prototype.all = function () {
  let body = this.post()
  let query = this.get()
  return _.merge(query, body)
}

/**
 * @function only
 * @description return only request keys from values returned from all method
 * @param {...} keys
 * @return {Object}
 * @public
 */
Request.prototype.only = function () {
  let all = this.all()
  return helpers.returnRequestKeysFromObject(all, arguments)
}

/**
 * @function except
 * @description return all values from all method except defined keys
 * @param {...} keys
 * @return {Object}
 * @public
 */
Request.prototype.except = function () {
  let all = this.all()
  return helpers.removeRequestedKeysFromObject(all, arguments)
}

/**
 * @function header
 * @description returns a selected header key from headers object
 * @param  {String} key
 * @param  {*} defaultValue
 * @return {*}
 * @public
 */
Request.prototype.header = function (key, defaultValue) {
  defaultValue = defaultValue || null
  return this.headers()[key] || defaultValue
}

/**
 * @function headers
 * @description return request headers
 * @return {Object}
 * @public
 */
Request.prototype.headers = function () {
  if(this.request.headers && this.request.headers['content-type']){
    this.request.headers['content-type'] = contentType.parse(this.request.headers['content-type']).type
  }
  return this.request.headers || {}
}

/**
 * @function path
 * @description return request path
 * @return {String}
 * @public
 */
Request.prototype.path = function () {
  return parseurl(this.request).pathname
}

/**
 * @function method
 * @description return request method/verb
 * @return {String}
 * @public
 */
Request.prototype.method = function () {
  return this.request.method
}

/**
 * @function ajax
 * @description tell whether request is ajaxed or not
 * @return {Boolean}
 * @public
 */
Request.prototype.ajax = function () {
  let xmlHeader = this.header('x-requested-with')
  return xmlHeader === 'XMLHttpRequest'
}

/**
 * @function pjax
 * @description tell whether request is pjax or not
 * @return {Boolean}
 * @public
 */
Request.prototype.pjax = function () {
  let pjaxHeader = this.header('x-pjax')
  return pjaxHeader
}

/**
 * @function ip
 * @description return request ip address
 * @return {String}
 * @public
 */
Request.prototype.ip = function () {
  return requestIp.getClientIp(this.request)
}

/**
 * @function accepts
 * @description returns best possible return type for a request
 * @param {...} keys
 * @return {String}
 * @public
 */
Request.prototype.accepts = function () {
  return helpers.checkHttpAcceptField(this.request, _.toArray(arguments))
}

/**
 * @function is
 * @description tells whether request content-type falls in required types
 * @param {...} keys
 * @return {Boolean}
 * @public
 */
Request.prototype.is = function () {
  return helpers.checkHttpContentType(this.request, _.toArray(arguments))
}

/**
 * @function cookie
 * @description returns cookie value corresponding to a given key
 * @param  {String} key
 * @param  {*} defaultValue
 * @return {*}
 * @public
 */
Request.prototype.cookie = function (key, defaultValue) {
  defaultValue = defaultValue || null
  return this.cookies()[key] || defaultValue
}

/**
 * @function cookies
 * @description return cookies attached on a given
 * request
 * @return {Object}
 * @public
 */
Request.prototype.cookies = function () {
  return Cookies.parse(this.request)
}

module.exports = Request
