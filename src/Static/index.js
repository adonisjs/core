'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Static assets for adonis app
 */

// importing libraries
const nodeStatic = require('node-static')
const favicon = require('serve-favicon')

let fileServer = null
let faviconServer = null
let publicNamespace = null

// export static module
let Static = exports = module.exports = {}

/**
 * finding whether request is for static resource or not
 * @param  {String}  url
 * @return {Boolean}
 */
Static.isStatic = function (url) {
  let regex = new RegExp(`^\/${publicNamespace}`)
  return regex.test(url)
}

/**
 * replacing publicNamespace from url while serving static resources
 * @param  {String}  url
 * @return {Boolean}
 */
Static.removePublicNamespace = function (url) {
  return url.replace(`/${publicNamespace}`, '')
}

/**
 * register directory as a static directory to be used
 * for serving static resources.
 * @param  {String} namespace
 * @param  {String} path_to_dir
 * @param  {Object} options
 */
Static.public = function (namespace, path_to_dir, options) {
  options = options || {}
  publicNamespace = namespace
  fileServer = new nodeStatic.Server(path_to_dir, options)
}

/**
 * register directory to serve favicon
 * @param  {String} path_to_favicon
 */
Static.favicon = function (path_to_favicon) {
  faviconServer = favicon(path_to_favicon)
}

/**
 * serve request file from static directory
 * @param  {Object}   request
 * @param  {Object}   response
 * @param  {Function} cb
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
 * serves favicon from registered path
 * @param  {Object}   request
 * @param  {Object}   response
 * @param  {Function} cb
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
