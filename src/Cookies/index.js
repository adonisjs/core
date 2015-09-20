'use strict'

/**
 * adonis-framework 
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

/**
 * a tiny module to take input and attach cookies to given
 * response.
 */

const cookie = require('cookie')
const _ = require('lodash')

let Cookies = exports = module.exports = {};

/**
 * parses cookie header and returns an object
 * @param  {String} cookieHeader
 * @return {Object}
 */
Cookies.parse = function (req) {
  if (!req.headers.cookie) {
    return {}
  }
  return cookie.parse(req.headers.cookie)
}

/**
 * attach cookie key , value pair to response
 * @param  {Object} res
 * @param  {String} key
 * @param  {*} value
 * @return {void}
 */
Cookies.attach = function (res,key,value) {
	const cookieString = cookie.serialize(key,value);
	res.setHeader("Set-Cookie", [cookieString]);
}

/**
 * attach cookie key/value pair from single 
 * node object
 * @param  {Object} res
 * @param  {Object} hash
 * @return {void}
 */
Cookies.attachObject = function (res,hash) {
	let cookieString = []
	_.each(hash, function (value,key) {
		cookieString.push(cookie.serialize(key,value))
	})
	res.setHeader("Set-Cookie",cookieString);
}