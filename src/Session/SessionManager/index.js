'use strict'

/**
 * adonis-framework 
 * Copyright(c) - Harminder Virk
 * MIT Licensed
*/

const Cookies = require('../../Cookies')
const helpers = require('./helpers')
const _ = require('lodash')

class SessionManager {

	constructor (req,res) {
		this.request = req
		this.response = res
	}

	static get sessionKey() {
		return 'adonis-session'
	}

	_makeBody(key, value) {

		/**
		 * getting typeof value , required to format
		 * values properly before saving them.
		 * @type {String}
		 */
		const type = typeof(value)

		/**
		 * converting value to string based upon it's 
		 * type. It is required as we cannot save
		 * raw objects to cookies or to files.
		 * @type {String}
		 */
		value = helpers.typeToString(value)

		/**
		 * body to save to session, it is the final
		 * format save by all drivers
		 * @type {Object}
		 */
		const body = {
			d: {key,value},
			t: type
		}

		return body

	}

	*put (key, value) {

		/**
		 * access to this for callback methods
		 */
		const self = this

		/**
		 * session id for session , by default 
		 * it is null
		 * @type {[type]}
		 */
		let sessionId = null

		/**
		 * parsing existing cookies to read
		 * adonis-session if exists.
		 * @type {Array}
		 */
		const cookies = Cookies.parse(this.request)

		/**
		 * setting existing session if there , otherwise
		 * setting up existing session as an array.
		 * @type {Array}
		 */
		let existingSession = cookies['adonis-session'] || []

		if(key && !value && typeof(key) !== 'object'){
			throw new Error('session requires key/value pair of an object')
		}

		if(!value && typeof(key) === 'object'){

			/**
			 * if user has passed an object , containing multiple session
			 * values , loop through them and push individual item
			 */
			_.each(key, function (item,index) {
				existingSession.push(self._makeBody(index,item))
			})

		}else{

			/**
			 * otherwise push original key/value pair
			 * passed to this method
			 */
			existingSession.push(this._makeBody(key,value))			

		}

		/**
		 * pushing new value to existing session 
		 * array.
		 */
		existingSession = JSON.stringify(existingSession)


		if(this.constructor.driver === 'cookie'){

			/**
			 * when someone is using cookie as the session driver , we 
			 * not need a driver to save values instead we set 
			 * session value as session id. Not a hack but
			 * little confusing
			*/
			sessionId = existingSession

		}else{

			/**
			 * here we create session id , as data storage is 
			 * not cookie and need way to reference session
			 * values
			 */
			sessionId = helpers.generateSessionId()
			yield this.constructor.driver.write(sessionId,existingSession)

		}


		/**
		 * generating cookie string to push to cookies 
		 * which will be used by response object
		 * while making response
		 * @type {Object}
		 */
		const session = {key:this.constructor.sessionKey,value:sessionId}

		/**
		 * if cookies does not exists already on response , set them 
		 * as an empty object
		 * @type {Object}
		 */
		this.response._cookies = this.response._cookies || {}

		/**
		 * finally setting up session
		 */
		this.response._cookies[this.constructor.sessionKey] = session

	}


	* get (key) {
		const cookies = Cookies.parse(this.request)
		let session = cookies['adonis-session']
		let pairs = {}

		if(!session){
			return null
		}

		if(this.constructor.driver !== 'cookie'){
			session = yield this.constructor.driver.read(session)
		}

		session = JSON.parse(session)

		pairs = _.object(_.map(session, function(item,index) {
			item = helpers.stringToType(item)
			return [item.d.key,item.d.value]
		}))

		return pairs[key]

	}

}

module.exports = SessionManager