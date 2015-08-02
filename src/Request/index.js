"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Adds glue to http req object by providing convience methods
 */



const querystring = require("querystring"),
  parseurl = require("parseurl"),
  requestIp = require("request-ip"),
  _ = require("lodash"),
  helpers = require("./helpers");



/**
 * Request class
 * @param {Object} req
 * @constructor
 */
function Request(req) {
  this.request = req;
}



/**
 * returning query string values from request as object
 * @return {Object}
 */
Request.prototype.get = function() {
  let query = querystring.parse(parseurl(this.request).query);
  return helpers.return_requested_keys_from_object(query, arguments);
};


/**
 * returning route params
 * @return {Object}
 */
Request.prototype.params = function() {
  return helpers.return_requested_keys_from_object(this.request.params, arguments);
};


/**
 * return post values from request as object
 * @return {Object}
 */
Request.prototype.post = function() {
  let body = this.body
  return helpers.return_requested_keys_from_object(body, arguments);
};



/**
 * return uploaded files from request
 * @return {Object}
 */
Request.prototype.files = function() {
  let files = this.uploadedFiles
  return helpers.return_requested_keys_from_object(files, arguments);
};



/**
 * merge get and post values and return them together
 * @return {Object}
 */
Request.prototype.all = function() {
  let body = this.post(),
    query = this.get();
  return _.merge(query, body);
};



/**
 * return only request keys from values returned from all method
 * @return {Object}
 */
Request.prototype.only = function() {
  let all = this.all();
  return helpers.return_requested_keys_from_object(all, arguments);
};


/**
 * return all values from all method except defined keys
 * @return {Object}
 */
Request.prototype.except = function() {
  let all = this.all();
  return helpers.remove_requested_keys_from_object(all, arguments);
};



/**
 * return request headers
 * @return {Object}
 */
Request.prototype.headers = function() {
  let headers = this.request.headers;
  return helpers.return_requested_keys_from_object(headers, arguments);
}


/**
 * return request path
 * @return {String}
 */
Request.prototype.path = function() {
  return parseurl(this.request).pathname
}


/**
 * return request method/verb
 * @return {String}
 */
Request.prototype.method = function() {
  return this.request.method;
};



/**
 * tell whether request is ajaxed or not
 * @return {Boolean}
 */
Request.prototype.ajax = function() {
  let xmlHeader = this.headers('X-Requested-With');
  return xmlHeader['X-Requested-With'] === 'XMLHttpRequest';
};


/**
 * tell whether request is pjax or not
 * @return {Boolean}
 */
Request.prototype.pjax = function() {
  let xmlHeader = this.headers('X-PJAX')
  return xmlHeader['X-PJAX'] == true
};


/**
 * return request ip address
 * @return {String}
 */
Request.prototype.ip = function() {
  return requestIp.getClientIp(this.request);
};



/**
 * returns best possible return type for a request
 * @return {String}
 */
Request.prototype.accepts = function(){
  return helpers.check_http_accept_field(this.request,_.toArray(arguments));
}


/**
 * tells whether request content-type falls in required typed
 * @return {Boolean} [description]
 */
Request.prototype.is = function(){
  return helpers.check_http_content_type(this.request, _.toArray(arguments));
}


/**
 * return request cookies
 * @return {Object}
 */
Request.prototype.cookies = function() {
  if (!this.request.headers.cookie) {
    return {}
  }
  let cookies = cookie.parse(this.request.headers.cookie)
  return Helpers.return_requested_keys_from_object(cookies, arguments);
};



module.exports = Request;