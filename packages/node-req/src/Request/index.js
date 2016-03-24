'use strict'

/**
 * node-req
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const parseurl = require('parseurl')
const qs = require('qs')
const fresh = require('fresh')
const proxyaddr = require('proxy-addr')
const isIP = require('net').isIP
const accepts = require('accepts')
const is = require('type-is')

/**
 * @description compiles different values of trust proxy
 * into an invokable function.
 * INSPIRED BY EXPRESS
 * @method compileTrust
 * @param  {Mixed}     value
 * @return {Function}
 */
const compileTrust = function (value) {
  if (typeof (value) === 'function') {
    return value
  }
  if (value === true) {
    return function () {
      return true
    }
  }
  if (typeof (value) === 'number') {
    return function (a, i) {
      return i < value
    }
  }
  if (typeof value === 'string') {
    value = value.split(/ *, */)
  }
  return proxyaddr.compile(value || [])
}

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
  const headers = Request.headers(request)

  switch (key) {
    case 'referer':
    case 'referrer':
      return headers.referrer || headers.referer
    default:
      return headers[key]
  }
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
  if (method !== 'GET' && method !== 'HEAD') {
    return false
  }

  /**
   * 2xx or 304 as per rfc2616 14.26
   */
  if ((status >= 200 && status < 300) || status === 304) {
    return fresh(request.headers, (response.headers || {}))
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
 * @param  {Mixed} trust
 * @return {String}
 */
Request.ip = function (request, trust) {
  return proxyaddr(request, compileTrust(trust))
}

/**
 * @description returns list of all remote addresses
 * ordered in closest to furthest trusted address
 * @method ips
 * @param  {Object} request
 * @param  {Mixed} trust
 * @return {Array}
 * @public
 */
Request.ips = function (request, trust) {
  const addresses = proxyaddr.all(request, compileTrust(trust))
  return addresses.slice(1).reverse()
}

/**
 * @description returns request protocol based upon encrypted connection
 * or X-Forwaded-Proto header
 * @method protocol
 * @param  {Object} request
 * @return {String}
 * @public
 */
Request.protocol = function (request, trust) {
  let proto = request.connection.encrypted ? 'https' : 'http'
  trust = compileTrust(trust)
  if (!trust(request.connection.remoteAddress, 0)) {
    return proto
  }
  proto = Request.header(request, 'X-Forwarded-Proto') || proto
  return proto.split(/\s*,\s*/)[0]
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
  return Request.protocol(request) === 'https'
}

/**
 * returns request subdomain
 * @method subdomains
 * @param  {Object}   request
 * @param  {Mixed}    trust
 * @param  {Number}   offset
 * @return {Array}
 * @public
 */
Request.subdomains = function (request, trust, offset) {
  offset = offset || 2
  const hostname = Request.hostname(request, trust)

  if (!hostname || isIP(hostname)) {
    return []
  }

  let subdomains = hostname.split('.').reverse()
  subdomains = subdomains.slice(offset)
  /**
   * remove www if is the last subdomain
   * after reverse
   */
  if (subdomains[subdomains.length - 1] === 'www') {
    subdomains.splice(subdomains.length - 1, 1)
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
  return xhr.toLowerCase() === 'xmlhttprequest'
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
  if (Request.header(request, 'X-Pjax')) {
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
Request.hostname = function (request, trust) {
  trust = compileTrust(trust)
  let host = Request.header(request, 'X-Forwarded-Host')

  /**
   * grabbing host header if trust proxy is disabled or host
   * does not exists on forwared headers
   */
  if (!host || !trust(request.connection.remoteAddress, 0)) {
    host = Request.header(request, 'Host')
  }

  if (!host) {
    return
  }

  /**
   * Support for IPv6
   */
  const offset = host[0] === '[' ? host.indexOf(']') + 1 : 0
  const index = host.indexOf(':', offset)
  return index !== -1 ? host.substring(0, index) : host
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
  if (is.is(request, keys)) {
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

/**
 * @description tells whether request has body or
 * not to be read by any body parser
 * @method accepts
 * @param  {Object} request
 * @return {Boolean}
 */
Request.hasBody = function (request) {
  return is.hasBody(request)
}
