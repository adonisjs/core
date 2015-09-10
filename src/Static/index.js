'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const nodeStatic = require('node-static')
const favicon = require('serve-favicon')

/**
 * storing instance to static favicon
 * server
 * @type {Object}
 * @private
 */
let fileServer = null

/**
 * storing instance to faviconServer
 * @type {Object}
 * @private
 */
let faviconServer = null

/**
 * public namespace , base path to
 * public directory
 * @type {String}
 */
let publicNamespace = null

let Static = exports = module.exports = {}

/**
 * @function isStatic
 * @description finding whether request is for static resource or not
 * @param  {String}  url
 * @return {Boolean}
 * @public
 */
Static.isStatic = function (url) {
  let regex = new RegExp(`^${publicNamespace}`)
  return regex.test(url)
}

/**
 * @function clear
 * @description removes all internal mappings
 * @public
 */
Static.clear = function () {
  fileServer = null
  faviconServer = null
  publicNamespace = null
}

/**
 * @function removePublicNamespace
 * @description replacing publicNamespace from url while serving static resources
 * @param  {String}  url
 * @return {Boolean}
 * @private
 */
Static.removePublicNamespace = function (url) {
  return url.replace(publicNamespace, '')
}

/**
 * @function public
 * @description register directory as a static directory to be used
 * for serving static resources.
 * @param  {String} namespace
 * @param  {String} path_to_dir
 * @param  {Object} options
 * @public
 */
Static.public = function (namespace, path_to_dir, options) {
  options = options || {}
  publicNamespace = namespace.indexOf('/') > -1 ? namespace : `/${namespace}`
  fileServer = new nodeStatic.Server(path_to_dir, options)
}

/**
 * @function favicon
 * @description register directory to serve favicon
 * @param  {String} path_to_favicon
 * @public
 */
Static.favicon = function (path_to_favicon) {
  faviconServer = favicon(path_to_favicon)
}

/**
 * @function serve
 * @description serve request file from static directory
 * @param  {Object}   request
 * @param  {Object}   response
 * @param  {Function} cb
 * @public
 */
Static.serve = function (request, response, cb) {
  if (fileServer) {
    fileServer.serve(request, response, cb)
    return
  }
  response.writeHead(404, {
    'content-type': 'text/plain'
  })
  response.end('404')
}

/**
 * @function serveFavicon
 * @description serves favicon from registered path
 * @param  {Object}   request
 * @param  {Object}   response
 * @param  {Function} cb
 * @public
 */
Static.serveFavicon = function (request, response, cb) {
  if (faviconServer) {
    faviconServer(request, response, cb)
    return
  }
  response.writeHead(404, {
    'content-type': 'text/plain'
  })
  response.end('404')
}
