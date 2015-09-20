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
const Keygrip = require('keygrip')
const signature = require('cookie-signature')

let Cookies = exports = module.exports = {};

/**
 * parses cookie header and returns an object
 * @param  {String} cookieHeader
 * @return {Object}
 */
Cookies.parse = function (req) {

	/**
	 * if cookie does not exists on header , return 
	 * an empty object
	 */
  if (!req.headers.cookie) {
    return {}
  }

  /**
   * parsing all cookies and getting a normal object
   */
  const parsedCookies = cookie.parse(req.headers.cookie)

  /**
   * if APP_KEY on process exists , take the pleasure
   * to unsign and decrypt cookies.
   */
  if(process.env.APP_KEY){

  	/**
  	 * setting up grip instance with APP_KEY , this 
  	 * is the only key used for any encryptions
  	 */
  	const keygrip = new Keygrip([process.env.APP_KEY])

  	/**
  	 * saving only cookies which are unsigned
  	 * and decrypted successfully
  	 */
	  let normalizedCookies = {}

  	_.each(parsedCookies, function (item, index) { 

  		/**
  		 * unsigning first
  		 */
  		const unsigned = signature.unsign(item,process.env.APP_KEY)

  		/** 
  		 * if able to unsign cookie value 
  		 * then descrypt it.
  		*/
  		if(unsigned){

  			/**
  			 * decrypting using keygrip
  			 */
  			const decrypted = keygrip.decrypt(new Buffer(unsigned,'base64'))

  			if(decrypted[0]){
  				normalizedCookies[index] = decrypted[0].toString('utf8')
  			}

  		}

  	})

  	/**
  	 * returning normalizedCookies after
  	 * unsign and decryption
  	 */
  	return normalizedCookies

  }

  /**
   * if APP_KEY is not set, return all 
   * cookies as they are
   */
  return parsedCookies

}

/**
 * attach cookie key/value pair from 
 * flat array
 * @param  {Object} res
 * @param  {Object} hash
 * @return {void}
 */
Cookies.attachObject = function (res, hash) {

	const cookieString = []

	/**
	 * looping through an object to set multiple cookies
	 */
	_.each(hash, function (item) {
		if(process.env.APP_KEY){
			const keygrip = new Keygrip([process.env.APP_KEY])
			item.value = keygrip.encrypt(item.value).toString('base64')
			item.value = signature.sign(item.value,process.env.APP_KEY)
		}
		cookieString.push(cookie.serialize(item.key,item.value,item.options))
	})

	res.setHeader("Set-Cookie",cookieString)

}