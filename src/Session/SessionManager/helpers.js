'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2105 Harminder Virk
 * MIT Licensed
*/

const crypto = require('crypto')

let helpers = exports = module.exports = {}

/**
 * returns values converted into string from different
 * data types in Javascript.
 * @param  {*} value
 * @return {String}
 */
helpers.typeToString = function (value) {

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
			value.d = !!value.d === 'true'
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