'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2105 Harminder Virk
 * MIT Licensed
*/

const crypto = require('crypto')
const _ = require('lodash')

let helpers = exports = module.exports = {}

/**
 * returns values converted into string from different
 * data types in Javascript.
 * @param  {*} value
 * @return {String}
 */
helpers.typeToString = function (value) {

	if(!value) return value

	switch(typeof(value)){

		/**
		 * if value is an object , convert
		 * it to string using stringify.
		 */
		case 'object':
			value = JSON.stringify(value)
			break

		/**
		 * if value is a number , convert it to
		 * string using toString method
		 */
		case 'number':
			value = value.toString()
			break

		/**
		 * if value is a boolean , convert it to
		 * string using toString method
		 */
		case 'boolean':
			value = value.toString()
			break
	}

	return value
}

/**
 * converting string values back to original datatype
 * based upon their type
 * @param  {Object} value
 * @return {Object}
 */
helpers.stringToType = function (value) {
	switch (value.t){
		case 'object':
			value.d = JSON.parse(value.d)
			break

		case 'number':
			value.d = parseInt(value.d)
			break

		case 'boolean':
			value.d = (value.d === 'true' || value.d === '1') ? true : false
			break
	}
	return value
}

/**
 * returns a random session id using current
 * timestamp and encrypt it using crypto
 * @return {String}
 */
helpers.generateSessionId = function () {
	const sha = crypto.createHash('sha256')
	sha.update(`${new Date().getTime().toString()}${Math.random().toString()}`)
	return sha.digest('hex')
}

/**
 * @function pushToSession
 * @description here we update values on session object
 * which is supposed to be saved with a given driver
 * also making sure we replace the existing session
 * with new value if same key is used.
 * @param  {Object}      existingSession
 * @param  {*}      value
 * @return {void}
 * @public
 */
helpers.pushToSession = function (existingSession, value) {

	/**
	 * storing whether key/value pair already exists on session
	 * object or not.
	 * @type {Boolean}
	 */
	let matchFound = false

	/**
	 * if existing session is empty, simply push values
	 * on it.
	 */
	if(_.size(existingSession) === 0){
		existingSession.push(value)
		return
	}

	_.each(existingSession, function (item, index) {
		/**
		 * if key/value pair already exists on session, update
		 * it's value with new value and set matchFound to
		 * true.
		 */
		if(value.d.key === item.d.key){
			item = value
			matchFound = true
		}
		existingSession[index] = item
	})

	/**
	 * if key/value pair does not exists on session. Push
	 * values to it.
	 */
	if(!matchFound){
		existingSession.push(value)
	}

}
