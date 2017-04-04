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
 * Parses query string from url an returns
 * an object.
 *
 * @method get
 *
 * @param  {Object} request
 * @param  {Object} [options]    Options are passed to https://www.npmjs.com/package/qs
 *
 * @return {Object}
 *
 * @example
 * ```js
 * const queryString = nodeReq.get(req)
 * ```
 */
Request.get = function (request, options = {}) {
  return qs.parse(parseurl(request).query, options)
}

/**
 * Returns the exact copy of `request.method`. Defined
 * [here](https://nodejs.org/api/http.html#http_message_method)
 *
 * @method method
 *
 * @param  {Object} request
 *
 * @return {String}
 *
 * @example
 * ```js
 * const method = nodeReq.method(req)
 * ```
 */
Request.method = function (request) {
  return request.method
}

/**
 * Returns an object of headers for a given
 * request.
 *
 * @method headers
 *
 * @param  {Object} request
 *
 * @return {Object}
 *
 * @example
 * ```js
 * const headers = nodeReq.headers(req)
 * ```
 */
Request.headers = function (request) {
  return request.headers
}

/**
 * Returns header value for a given key. Also
 * it will handle the inconsistencies between
 * `referer` and `referrer` header.
 *
 * @method header
 *
 * @param  {Object} request
 * @param  {String} key
 * @return {String}
 *
 * @example
 * ```js
 * const authHeader = nodeReq.header(req, 'Authorization')
 * ```
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
 * Returns the freshness of a response inside the client
 * cache. If client cache has the latest response, this
 * method will return `true`, otherwise it will return
 * `false`.
 *
 * Also when HTTP header `Cache-Control: no-cache` is present
 * this method will return false everytime.
 *
 * @method fresh
 *
 * @param  {Object} request
 * @param  {Object} response
 *
 * @return {Boolean}
 *
 * @example
 * ```js
 * if (nodeReq.fresh(req, res)) {
 *    res.writeHead(304)
 * }
 * ```
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
 * This method is the opposite of the {{#crossLink "Request/fresh"}}{{/crossLink}} method
 *
 * @method stale
 *
 * @param  {Object} request
 *
 * @return {Boolean}
 *
 * @example
 * ```js
 * if (!nodeReq.stale(req, res)) {
 *    res.writeHead(304)
 * }
 * ```
 */
Request.stale = function (request, response) {
  return !Request.fresh(request, response)
}

/**
 * Returns the most trusted ip address for the HTTP
 * request. It will handle the use cases where your
 * server is behind a proxy.
 *
 * Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
 * for the available options for `trust`.
 *
 * @method ip
 *
 * @param  {Object} request
 * @param  {Mixed}  [trust]
 *
 * @return {String}
 *
 * @example
 * ```js
 * nodeReq.ip(req, '127.0.0.1')
 * nodeReq.ip(req, ['::1/128', 'fe80::/10'])
 * ```
 */
Request.ip = function (request, trust) {
  return proxyaddr(request, compileTrust(trust))
}

/**
 * Returns list of all remote addresses ordered with
 * most trusted on the top of the list.
 *
 * Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
 * for the available options for `trust`.
 *
 * @method ips
 *
 * @param  {Object} request
 * @param  {Mixed}  [trust]
 *
 * @return {Array}
 *
 * @example
 * ```
 * nodeReq.ips(req, '127.0.0.1')
 * nodeReq.ips(req, ['::1/128', 'fe80::/10'])
 * ```
 */
Request.ips = function (request, trust) {
  const addresses = proxyaddr.all(request, compileTrust(trust))
  return addresses.slice(1).reverse()
}

/**
 * Returns request protocol based upon encrypted
 * connection or X-Forwaded-Proto header.
 *
 * Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
 * for the available options for `trust`.
 *
 * @method protocol
 *
 * @param  {Object} request
 * @param  {Mixed} [trust]
 *
 * @return {String}
 *
 * @example
 * ```
 * const protocol = nodeReq.protocol(req)
 * ```
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
 * Looks for request protocol to check for
 * https existence or returns false.
 *
 * @method secure
 *
 * @param  {Object} request
 *
 * @return {Boolean}
 *
 * @example
 * ```
 * const isHttps = nodeReq.secure(req)
 * ```
 */
Request.secure = function (request) {
  return Request.protocol(request) === 'https'
}

/**
 * Returns the request subdomains as an array. Also
 * it will make sure to exclude `www` from the
 * subdomains list.
 *
 * Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
 * for the available options for `trust`.
 *
 * @method subdomains
 *
 * @param  {Object}   request
 * @param  {Mixed}    [trust]
 * @param  {Number}   [offset = 2] subdomain offset
 *
 * @return {Array}
 *
 * @example
 * ```js
 * const subdomains = nodeReq.subdomains(req)
 * ```
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
 * Determines whether request is an ajax request
 * or not, based on X-Requested-With header.
 *
 * @method ajax
 *
 * @param  {Object} request
 *
 * @return {Boolean}
 *
 * @example
 * ```js
 * if (nodeReq.ajax(req)) {
 *    res.writeHead(200, {"Content-type": "application/json"})
 * } else {
 *    res.writeHead(200, {"Content-type": "text/html"})
 * }
 * ```
 */
Request.ajax = function (request) {
  const xhr = Request.header(request, 'X-Requested-With') || ''
  return xhr.toLowerCase() === 'xmlhttprequest'
}

/**
 * Tells whether request has X-Pjax
 * header or not.
 *
 * @method pjax
 *
 * @param  {Object} request
 *
 * @return {Boolean}
 *
 * @example
 * ```js
 * if (nodeReq.pjax(req)) {
 *    // return partial content
 * } else {
 *    // full page refresh
 * }
 * ```
 */
Request.pjax = function (request) {
  return !!Request.header(request, 'X-Pjax')
}

/**
 * Returns the hostname of HTTP request.
 *
 * Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
 * for the available options for `trust`.
 *
 * @method hostname
 *
 * @param  {Object} request
 * @param  {Mixed}  [trust]
 *
 * @return {String}
 *
 * @example
 * ```js
 * const hostname = nodeReq.hostname(request)
 * ```
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
    return null
  }

  /**
   * Support for IPv6
   */
  const offset = host[0] === '[' ? host.indexOf(']') + 1 : 0
  const index = host.indexOf(':', offset)
  return index !== -1 ? host.substring(0, index) : host
}

/**
 * Returns request url after removing the query
 * string.
 *
 * @method url
 *
 * @param  {Object} request
 *
 * @return {String}
 *
 * @example
 * ```js
 * const url = nodeReq.url(request)
 * ```
 */
Request.url = function (request) {
  return parseurl(request).pathname
}

/**
 * Returns the untouched url.
 *
 * @method originalUrl
 *
 * @param  {Object} request
 *
 * @return {String}
 *
 * @example
 * ```js
 * const url = nodeReq.originalUrl(request)
 * ```
 */
Request.originalUrl = function (request) {
  return parseurl(request).href
}

/**
 * Tells whether request accept content of a given
 * type or not (based on **Content-type**) header.
 *
 * @method is
 *
 * @param  {Object}  request
 * @param  {Mixed}   keys
 *
 * @return {String}
 *
 * @example
 * ```js
 * // req.headers.content-type = 'application/json'
 *
 * nodeReq.is(req, ['json']) // json
 * nodeReq.is(req, ['json', 'html']) // json
 * nodeReq.is(req, ['application/*']) // application/json
 *
 * nodeReq.is(req, ['html']) // '<empty string>'
 * ```
 */
Request.is = function (request, keys) {
  return is.is(request, keys) || ''
}

/**
 * Return the best possible response accepted by the
 * client. This is based on the `Accept` header.
 * [Learn more about it](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)
 *
 * @method accepts
 *
 * @param  {Object} request
 * @param  {Mixed} keys
 *
 * @return {String}
 *
 * @example
 * ```js
 * const type = nodeReq.accepts(req, ['json', 'html'])
 *
 * switch(type) {
 *  case 'json':
 *    res.setHeader('Content-Type', 'application/json')
 *    res.write('{"hello":"world!"}')
 *    break
 *
 *  case 'html':
 *    res.setHeader('Content-Type', 'text/html')
 *    res.write('<b>hello, world!</b>')
 *    break
 *
 *  default:
 *    res.setHeader('Content-Type', 'text/plain')
 *    res.write('hello, world!')
 * }
 * ```
 */
Request.accepts = function (request, keys) {
  const accept = accepts(request)
  return accept.type(keys)
}

/**
 * This method is similar to {{#crossLink "Request/accepts"}}{{/crossLink}},
 * instead it will return an array of types from most to least preferred
 * one.
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
 * Returns one of the most preferrable language.
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
 * Returns list of all accepted languages from most
 * to least preferred one.
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
 * Returns list of all encodings from most
 * to least preferred one.
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
 * Returns the best maching charset based upon
 * `Accept-Charset` header.
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
 * Returns a list of all charsets from most
 * to least preferred one based upon
 * `Accept-Charset` header.
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
 * Tells whether request has body or
 * not to be read by any body parser.
 *
 * @method hasBody
 *
 * @param  {Object} request
 * @return {Boolean}
 *
 * @example
 * ```js
 * if (nodeReq.hasBody(request)) {
 *    // use body parser
 * }
 * ```
 */
Request.hasBody = function (request) {
  return is.hasBody(request)
}
