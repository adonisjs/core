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
 * Facade over Node.js http.IncomingMessage request
 *
 * @module Request
 */
let Request = exports = module.exports = {}

/**
 * Parses query string from url an returns an object.
 *
 * @method get
 *
 * @param  {http.IncomingMessage} req
 * @param  {Object}               [options]    Options are passed to https://www.npmjs.com/package/qs
 *
 * @return {Object}
 *
 * @example
 * ```js
 * const queryString = nodeReq.get(req)
 * ```
 */
Request.get = (req, options = {}) => qs.parse(parseurl(req).query, options)

/**
 * Returns the exact copy of `request.method`. Defined
 * [here](https://nodejs.org/api/http.html#http_message_method)
 *
 * @method method
 *
 * @param  {http.IncomingMessage} req
 *
 * @return {String}
 *
 * @example
 * ```js
 * const method = nodeReq.method(req)
 * ```
 */
Request.method = (req) => req.method

/**
 * Returns an object of headers for a given
 * request.
 *
 * @method headers
 *
 * @param  {http.IncomingMessage} req
 *
 * @return {Object}
 *
 * @example
 * ```js
 * const headers = nodeReq.headers(req)
 * ```
 */
Request.headers = (req) => req.headers

/**
 * Returns header value for a given key. Also
 * it will handle the inconsistencies between
 * `referer` and `referrer` header.
 *
 * @method header
 *
 * @param  {http.IncomingMessage} req
 * @param  {String} key
 * @return {String}
 *
 * @example
 * ```js
 * const authHeader = nodeReq.header(req, 'Authorization')
 * ```
 */
Request.header = function (req, key) {
  key = key.toLowerCase()
  const headers = Request.headers(req)

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
 * @param  {http.IncomingMessage} req
 * @param  {http.ServerResponse}  res
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
Request.fresh = function (req, res) {
  const method = Request.method(req)
  const status = res.statusCode

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
    const responseHeaders = typeof (res.getHeaders) === 'function' ? res.getHeaders() : (res._headers || {})
    return fresh(req.headers, responseHeaders)
  }

  return false
}

/**
 * This method is the opposite of the `nodeReq.fresh`
 *
 * @method stale
 *
 * @param  {http.IncomingMessage} req
 * @param  {http.ServerResponse}  res
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
Request.stale = (req, res) => !Request.fresh(req, res)

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
 * @param  {http.IncomingMessage} req
 * @param  {Mixed}                [trust]
 *
 * @return {String}
 *
 * @example
 * ```js
 * nodeReq.ip(req, '127.0.0.1')
 * nodeReq.ip(req, ['::1/128', 'fe80::/10'])
 * ```
 */
Request.ip = (req, trust) => proxyaddr(req, compileTrust(trust))

/**
 * Returns list of all remote addresses ordered with
 * most trusted on the top of the list.
 *
 * Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
 * for the available options for `trust`.
 *
 * @method ips
 *
 * @param  {http.IncomingMessage} req
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
Request.ips = function (req, trust) {
  const addresses = proxyaddr.all(req, compileTrust(trust))
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
 * @param  {http.IncomingMessage} req
 * @param  {Mixed}                [trust]
 *
 * @return {String}
 *
 * @example
 * ```
 * const protocol = nodeReq.protocol(req)
 * ```
 */
Request.protocol = function (req, trust) {
  let proto = req.connection.encrypted ? 'https' : 'http'
  trust = compileTrust(trust)

  if (!trust(req.connection.remoteAddress, 0)) {
    return proto
  }

  proto = Request.header(req, 'X-Forwarded-Proto') || proto
  return proto.split(/\s*,\s*/)[0]
}

/**
 * Looks for request protocol to check for
 * https existence or returns false.
 *
 * @method secure
 *
 * @param  {http.IncomingMessage} req
 *
 * @return {Boolean}
 *
 * @example
 * ```
 * const isHttps = nodeReq.secure(req)
 * ```
 */
Request.secure = (req) => Request.protocol(req) === 'https'

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
 * @param  {http.IncomingMessage} req
 * @param  {Mixed}                [trust]
 * @param  {Number}               [offset = 2] subdomain offset
 *
 * @return {Array}
 *
 * @example
 * ```js
 * const subdomains = nodeReq.subdomains(req)
 * ```
 */
Request.subdomains = function (req, trust, offset = 2) {
  const hostname = Request.hostname(req, trust)

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
 * @param  {http.IncomingMessage} req
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
Request.ajax = (req) => {
  return (Request.header(req, 'X-Requested-With') || '').toLowerCase() === 'xmlhttprequest'
}

/**
 * Tells whether request has X-Pjax
 * header or not.
 *
 * @method pjax
 *
 * @param  {http.IncomingMessage} req
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
Request.pjax = (request) => !!Request.header(request, 'X-Pjax')

/**
 * Returns the hostname of HTTP request.
 *
 * Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
 * for the available options for `trust`.
 *
 * @method hostname
 *
 * @param  {http.IncomingMessage} req
 * @param  {Mixed}                [trust]
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
 * @param  {http.IncomingMessage} req
 *
 * @return {String}
 *
 * @example
 * ```js
 * const url = nodeReq.url(request)
 * ```
 */
Request.url = (req) => parseurl(req).pathname

/**
 * Returns the untouched url.
 *
 * @method originalUrl
 *
 * @param  {http.IncomingMessage} req
 *
 * @return {String}
 *
 * @example
 * ```js
 * const url = nodeReq.originalUrl(request)
 * ```
 */
Request.originalUrl = (req) => parseurl(req).href

/**
 * Tells whether request accept content of a given
 * type or not (based on **Content-type**) header.
 *
 * @method is
 *
 * @param  {http.IncomingMessage} req
 * @param  {Mixed}                keys
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
Request.is = (request, keys) => is.is(request, keys) || ''

/**
 * Return the best possible response accepted by the
 * client. This is based on the `Accept` header.
 * [Learn more about it](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)
 *
 * @method accepts
 *
 * @param  {http.IncomingMessage} req
 * @param  {Mixed}                keys
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
Request.accepts = (req, keys) => accepts(req).type(keys)

/**
 * This method is similar to {{#crossLink "Request/accepts"}}{{/crossLink}},
 * instead it will return an array of types from most to least preferred
 * one.
 *
 * @method types
 *
 * @param  {http.IncomingMessage} req
 *
 * @return {Array}
 */
Request.types = (req) => accepts(req).types()

/**
 * Returns one of the most preferrable language.
 *
 * @method language
 *
 * @param  {http.IncomingMessage} req
 * @param  {Array} accepted
 *
 * @return {String}
 */
Request.language = function (req, accepted) {
  const acceptedLangs = accepts(req).language(accepted)
  return (acceptedLangs instanceof Array) ? acceptedLangs[0] : acceptedLangs
}

/**
 * Returns list of all accepted languages from most
 * to least preferred one.
 *
 * @method languages
 *
 * @param  {http.IncomingMessage} req
 *
 * @return {Array}
 */
Request.languages = (req) => accepts(req).languages()

/**
 * Returns the best maching encoding
 *
 * @method encoding
 *
 * @param  {http.IncomingMessage} req
 * @param  {Array} accepted
 *
 * @return {String}
 */
Request.encoding = function (req, accepted) {
  const acceptedEncoding = accepts(req).encoding(accepted)
  return (acceptedEncoding instanceof Array) ? acceptedEncoding[0] : acceptedEncoding
}

/**
 * Returns list of all encodings from most
 * to least preferred one.
 *
 * @method encodings
 *
 * @param  {http.IncomingMessage} req
 *
 * @return {Array}
 */
Request.encodings = (req) => accepts(req).encodings()

/**
 * Returns the best maching charset based upon
 * `Accept-Charset` header.
 *
 * @method charset
 *
 * @param  {http.IncomingMessage} req
 * @param  {Array}                accepted
 *
 * @return {String}
 */
Request.charset = function (req, accepted) {
  const acceptedCharsets = accepts(req).charset(accepted)
  return (acceptedCharsets instanceof Array) ? acceptedCharsets[0] : acceptedCharsets
}

/**
 * Returns a list of all charsets from most
 * to least preferred one based upon
 * `Accept-Charset` header.
 *
 * @method charsets
 *
 * @param  {http.IncomingMessage} req
 *
 * @return {Array}
 */
Request.charsets = (req) => accepts(req).charsets()

/**
 * Tells whether request has body or
 * not to be read by any body parser.
 *
 * @method hasBody
 *
 * @param  {http.IncomingMessage} req
 * @return {Boolean}
 *
 * @example
 * ```js
 * if (nodeReq.hasBody(request)) {
 *    // use body parser
 * }
 * ```
 */
Request.hasBody = (req) => is.hasBody(req)
