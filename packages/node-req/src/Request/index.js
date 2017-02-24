'use strict'

/*
 * node-req
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const parseurl = require('parseurl')
const qs = require('qs')
const fresh = require('fresh')
const proxyaddr = require('proxy-addr')
const isIP = require('net').isIP
const accepts = require('accepts')
const is = require('type-is')

const compileTrust = function (value) {
  /**
   * If value is a function, return it right away.
   */
  if (typeof (value) === 'function') {
    return value
  }

  /**
   * Wrap a boolean true inside a function
   * and return true
   */
  if (value === true) {
    return function () {
      return true
    }
  }

  /**
   * Wrap number inside a function and perform
   * required operations.
   */
  if (typeof (value) === 'number') {
    return function (a, i) {
      return i < value
    }
  }

  /**
   * Support comma-separated values
   */
  if (typeof value === 'string') {
    value = value.split(/ *, */)
  }

  /**
   * Finally let proxyaddr understand
   * and compile the input.
   */
  return proxyaddr.compile(value || [])
}

/**
 * Request class is used for reading request
 * information from native HTTP request.
 *
 * @class Request
 * @static
 */
let Request = exports = module.exports = {}

/**
 * returns all query string parameters
 *
 * @method get
 *
 * @param  {Object} request
 *
 * @return {Object}
 */
Request.get = function (request) {
  return qs.parse(parseurl(request).query)
}

/**
 * return request method (also known as http verb)
 *
 * @method method
 *
 * @param  {Object} request
 *
 * @return {String}
 */
Request.method = function (request) {
  return request.method
}

/**
 * returns header present on a request
 * as an object
 *
 * @method headers
 *
 * @param  {Object} request
 *
 * @return {Object}
 */
Request.headers = function (request) {
  return request.headers
}

/**
 * return value for a given header
 * using it's key
 * @method header
 * @param  {Object} request
 * @param  {String} key
 * @return {String}
 */
Request.header = function (request, key) {
  key = key.toLowerCase()
  const headers = Request.headers(request)

  switch (key) {
    case 'referer':
    case 'referrer':
      return headers.referrer || headers.referer || ''
    default:
      return headers[key] || ''
  }
}

/**
 * determines request freshness using
 * Last-modified and Etag
 *
 * @method fresh
 *
 * @param  {Object} request
 * @param  {Object} response
 *
 * @return {Boolean}
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
 * opposite of fresh
 *
 * @method stale
 *
 * @param  {Request} request
 *
 * @return {Boolean}
 */
Request.stale = function (request, response) {
  return !Request.fresh(request, response)
}

/**
 * returns remote address from trusted proxy or
 * returns closest untrusted address
 *
 * @method ip
 *
 * @param  {Object} request
 * @param  {Mixed}  trust
 *
 * @example
 * ```
 * Request.ip(req, '127.0.0.1')
 * Request.ip(req, ['::1/128', 'fe80::/10'])
 * ```
 *
 * `trust` parameter can be a boolean or a valid parameter defined
 * as in [proxy-addr docs](https://www.npmjs.com/package/proxy-addr)
 *
 * @return {String}
 */
Request.ip = function (request, trust) {
  return proxyaddr(request, compileTrust(trust))
}

/**
 * returns list of all remote addresses ordered
 * in closest to furthest trusted address.
 *
 * @method ips
 *
 * @param  {Object} request
 * @param  {Mixed} trust
 *
 * @return {Array}
 *
 * `trust` parameter can be a boolean or a valid parameter defined
 * as in [proxy-addr docs](https://www.npmjs.com/package/proxy-addr)
 *
 */
Request.ips = function (request, trust) {
  const addresses = proxyaddr.all(request, compileTrust(trust))
  return addresses.slice(1).reverse()
}

/**
 * returns request protocol based upon encrypted
 * connection or X-Forwaded-Proto header.
 *
 * @method protocol
 *
 * @param  {Object} request
 * @param  {Mixed} trust
 *
 * @return {String}
 *
 * `trust` parameter can be a boolean or a valid parameter defined
 * as in [proxy-addr docs](https://www.npmjs.com/package/proxy-addr)
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
 * looks for request protocol to check for
 * https existence or returns false
 *
 * @method secure
 *
 * @param  {Object} request
 *
 * @return {Boolean}
 */
Request.secure = function (request) {
  return Request.protocol(request) === 'https'
}

/**
 * returns request subdomain
 *
 * @method subdomains
 *
 * @param  {Object}   request
 * @param  {Mixed}    [trust]
 * @param  {Number}   [offset] subdomain offset
 *
 * @return {Array}
 */
Request.subdomains = function (request, trust, offset = 2) {
  const hostname = Request.hostname(request, trust)

  if (!hostname || isIP(hostname)) {
    return []
  }

  const subdomains = hostname.split('.').reverse().slice(offset)

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
 * determines whether request is an ajax request
 * or not based on X-Requested-With header.
 *
 * @method ajax
 *
 * @param  {Object} request
 *
 * @return {Boolean}
 */
Request.ajax = function (request) {
  const xhr = Request.header(request, 'X-Requested-With') || ''
  return xhr.toLowerCase() === 'xmlhttprequest'
}

/**
 * tells whether request has X-Pjax
 * header or not
 *
 * @method pjax
 *
 * @param  {Object} request
 *
 * @return {Boolean}
 */
Request.pjax = function (request) {
  return !!Request.header(request, 'X-Pjax')
}

/**
 * returns request hostname
 *
 * @method hostname
 *
 * @param  {Object} request
 *
 * @return {String}
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
 * returns request url without query string
 *
 * @method url
 *
 * @param  {Object} request
 *
 * @return {String}
 */
Request.url = function (request) {
  return parseurl(request).pathname
}

/**
 * returns actual url
 *
 * @method url
 *
 * @param  {Object} request
 *
 * @return {String}
 */
Request.originalUrl = function (request) {
  return parseurl(request).href
}

/**
 * tells whether request accept content of a given
 * type or not (based on Content-type) header
 *
 * @method is
 *
 * @param  {Object}  request
 * @param  {Mixed}   keys
 *
 * @return {Boolean}
 */
Request.is = function (request, keys) {
  return is.is(request, keys)
}

/**
 * returns best possible accept type
 * based upon Accept header
 *
 * @method accepts
 *
 * @param  {Object} request
 * @param  {Mixed} keys
 *
 * @return {String}
 */
Request.accepts = function (request, keys) {
  const accept = accepts(request)
  return accept.type(keys)
}

/**
 * Returns list of all mime types.
 *
 * @method types
 *
 * @param  {Object} request
 *
 * @return {Array}
 */
Request.types = function (request) {
  const accept = accepts(request)
  return accept.types()
}

/**
 * Returns one of the most preferrable language
 *
 * @method language
 *
 * @param  {Object} request
 * @param  {Array} accepted
 *
 * @return {String}
 */
Request.language = function (request, accepted) {
  const accept = accepts(request)
  const acceptedLangs = accept.language(accepted)
  return (acceptedLangs instanceof Array) ? acceptedLangs[0] : acceptedLangs
}

/**
 * Returns list of all accepted languages.
 *
 * @method languages
 *
 * @param  {Object} request
 *
 * @return {Array}
 */
Request.languages = function (request) {
  const accept = accepts(request)
  return accept.languages()
}

/**
 * Returns the best maching encoding
 *
 * @method encoding
 *
 * @param  {Object} request
 * @param  {Array} accepted
 *
 * @return {String}
 */
Request.encoding = function (request, accepted) {
  const accept = accepts(request)
  const acceptedEncoding = accept.encoding(accepted)
  return (acceptedEncoding instanceof Array) ? acceptedEncoding[0] : acceptedEncoding
}

/**
 * Returns list of all encodings
 *
 * @method encodings
 *
 * @param  {Object} request
 *
 * @return {Array}
 */
Request.encodings = function (request) {
  const accept = accepts(request)
  return accept.encodings()
}

/**
 * Returns the best maching encoding
 *
 * @method charset
 *
 * @param  {Object} request
 * @param  {Array} accepted
 *
 * @return {String}
 */
Request.charset = function (request, accepted) {
  const accept = accepts(request)
  const acceptedCharsets = accept.charset(accepted)
  return (acceptedCharsets instanceof Array) ? acceptedCharsets[0] : acceptedCharsets
}

/**
 * Returns a list of all charsets
 *
 * @method charsets
 *
 * @param  {Object} request
 * @return {Array}
 */
Request.charsets = function (request) {
  const accept = accepts(request)
  return accept.charsets()
}

/**
 * tells whether request has body or
 * not to be read by any body parser
 *
 * @method accepts
 *
 * @param  {Object} request
 * @return {Boolean}
 */
Request.hasBody = function (request) {
  return is.hasBody(request)
}
