'use strict'

/**
 * node-req
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

/**
 * @ignores
 */
const parseurl  = require('parseurl')
const qs        = require('qs')
const fresh     = require('fresh')
const proxyaddr = require('proxy-addr')
const isIP      = require('net').isIP
const accepts   = require('accepts')
const is        = require('type-is')

/**
 * @module Request
 * @description Lean io module for parsing http 
 * request.
 * @type {Object}
 */
let Request = exports = module.exports = {}

/**
 * @description returns all query string parameters
 * @method get
 * @param  {Object} request
 * @return {Object}
 * @public
 */
Request.get = function (request) {
  return qs.parse(parseurl(request).query)
}

/**
 * @description returns request post body, one 
 * have to make use of some body parser to 
 * set request body
 * @method post
 * @param  {Object} request
 * @return {Object}
 * @public
 */
Request.post = function (request) {
  return request._body
}

/**
 * @description return request method (also known as http verb)
 * @method method
 * @param  {Object} request
 * @return {String}
 * @public
 */
Request.method = function (request) {
  return request.method
}

/**
 * @description returns header present on a request
 * as an object
 * @method headers
 * @param  {Object} request
 * @return {Object}
 * @public
 */
Request.headers = function (request) {
  return request.headers
}

/**
 * @description return value for a given header
 * using it's key
 * @method header
 * @param  {Object} request
 * @param  {String} key
 * @return {Mixed}
 * @public
 */
Request.header = function (request, key) {
  key = key.toLowerCase()
  return Request.headers(request)[key]
}

/**
 * @description determines request freshness using
 * Last-modified and Etag ( reference from express )
 * @method fresh
 * @param  {Object} request
 * @param  {Object} response
 * @return {Boolean}
 * @public
 */
Request.fresh = function (request, response) {
  const method = Request.method(request)
  const status = response.statusCode

  /**
   * only for GET and HEAD
   */
  if(method !== 'GET' && method !== 'HEAD'){
    return false
  }

  /**
   * 2xx or 304 as per rfc2616 14.26
   */
  if ((status >= 200 && status < 300) || 304 === status) {
    return fresh(request.headers, (response.headers || {}));
  }

  return false
}

/**
 * @description opposite of fresh
 * @method stale
 * @param  {Request} request
 * @return {Boolean}
 * @public
 */
Request.stale = function (request, response) {
  return !Request.fresh(request, response)
}

/**
 * @description returns remote address from trusted
 * proxy or returns closest untrusted address
 * @method ip
 * @param  {Object}   request
 * @param  {Function} fn
 * @return {String}
 */
Request.ip = function (request, fn) {
  return proxyaddr(request,fn)
}

/**
 * @description returns list of all remote addresses
 * ordered in closest to furthest trusted address
 * @method ips
 * @param  {Object} request
 * @return {Array}
 * @public
 */
Request.ips = function (request) {
  return proxyaddr.all(request)
}

/**
 * @description looks for request protocol to check 
 * for https existence or returns false
 * @method secure
 * @param  {Object} request
 * @return {Boolean}
 * @public
 */
Request.secure = function (request) {
  return 'https' === parseurl(request).protocol
}

/**
 * returns request subdomain
 * @method subdomains
 * @param  {Object}   request
 * @param  {Number}   offset
 * @return {Array}
 * @public
 */
Request.subdomains = function (request, offset) {
  offset = offset || 2
  const hostname = parseurl(request).hostname

  if(!hostname || isIP(hostname)){
    return []
  }

  let subdomains =  hostname.split('.').reverse()
  subdomains = subdomains.slice(offset)
  /**
   * remove www if is the last subdomain 
   * after reverse
   */
  if(subdomains[subdomains.length - 1] === 'www'){
    subdomains.splice(subdomains.length -1,1)
  }
  return subdomains
}

/**
 * @description determines whether request is an ajax
 * request or not based on X-Requested-With header.
 * @method ajax
 * @param  {Object} request
 * @return {Boolean}
 * @public
 */
Request.ajax = function (request) {
  const xhr = Request.header(request, 'X-Requested-With') || ''
  return xhr.toLowerCase() === 'xmlhttprequest';
}

/**
 * @description tells whether request has x-jax
 * header or not
 * @method pjax
 * @param  {Object} request
 * @return {Boolean}
 * @public
 */
Request.pjax = function (request) {
  if(Request.header(request, 'X-Pjax')){
    return true
  }
  return false
}

/**
 * @description returns request hostname
 * @method hostname
 * @param  {Object} request
 * @return {String}
 * @public
 */
Request.hostname = function (request) {
  return parseurl(request).hostname
}

/**
 * @description returns request url without query string
 * or hashes
 * @method url
 * @param  {Object} request
 * @return {String}
 * @public
 */
Request.url = function (request) {
  return parseurl(request).pathname
}

/**
 * @description returns actual url
 * @method url
 * @param  {Object} request
 * @return {String}
 * @public
 */
Request.originalUrl = function (request) {
  return parseurl(request).href
}

/**
 * @description tells whether request accept content
 * of a given type or not (based on Content-type)
 * header
 * @method is
 * @param  {Object}  request
 * @param  {Mixed}   keys
 * @return {Boolean}
 * @public
 */
Request.is = function (request, keys) {
  if(is.is(request, keys)){
    return true
  }
  return false
}

/**
 * @description returns best possible accept type 
 * based upon Accept header
 * @method accepts
 * @param  {Object} request
 * @param  {Mixed} keys
 * @return {String}
 */
Request.accepts = function (request, keys) {
  const accept = accepts(request)
  return accept.type(keys)
}
