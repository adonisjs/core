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

	/**
	 * @description create session string to be saved with
	 * active driver.
	 * @method _makeBody
	 * @param  {String}  key
	 * @param  {*}  value
	 * @return {Object}
	 */
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
		 * format saved by all drivers
		 * @type {Object}
		 */
		const body = {
			d: {key,value},
			t: type
		}
		return body
	}

	/**
	 * @function put
	 * @description adding key/value pair to session
	 * object
	 * @param  {String} key
	 * @param  {*} value
	 * @return {void}
	 * @public
	 */
	* put (key, value, options) {
		/**
		 * throwing error when key/value pair or object is not
		 * passed while saving cookies
		 */
		if(key && !value && typeof(key) !== 'object'){
			throw new Error('session requires key/value pair of an object')
		}

		/**
		 * access to this for callback methods
		 */
		const self = this

		/**
		 * session id for session , by default
		 * it is null
		 * @type {String}
		 */
		let sessionId = null

		/**
		 * initializing existing session with an empty array.
		 * If existing session exists it will be replaced
		 * with session object.
		 * @type {Array}
		 */
		let existingSession = []

		/**
		 * parsing existing cookies to read
		 * adonis-session if exists.
		 * @type {Array}
		 */
		const cookies = Cookies.parse(this.request)

		/**
		 * here we read session id from cookie. It will be actual
		 * session object if cookie driver is in use. Otherwise
		 * it will be the unique session id.
		 * @type {String}
		 * @encrypted false
		 */
		sessionId = cookies['adonis-session']

		/**
		 * we will get session information if session id
		 * exists otherwise we create a fresh instance
		 * of session
		 */
		if(sessionId){
			if(this.constructor.driver === 'cookie'){
				try{
					existingSession = JSON.parse(sessionId)
				}catch(e){
					// ignoring error
				}
			}else{
				existingSession = yield this.constructor.driver.read(sessionId)
			}
		}

		if(typeof(key) === 'object') {
      options = value
			/**
			 * if user has passed an object , containing multiple session
			 * values , loop through them and push individual item
			 */
			_.each(key, function (item,index) {
				helpers.pushToSession(existingSession,self._makeBody(index,item))
			})
		}else{
			/**
			 * otherwise push original key/value pair
			 * passed to this method
			 */
			helpers.pushToSession(existingSession,self._makeBody(key,value))
		}

		/**
		 * converting session back to string to be saved inside
		 * cookie
		 * @type {String}
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
			sessionId = sessionId || helpers.generateSessionId()
			yield this.constructor.driver.write(sessionId,existingSession)
		}

		/**
		 * generating cookie string to push to cookies
		 * which will be used by response object
		 * while making response
		 * @type {Object}
		 */
		const session = {key:this.constructor.sessionKey,value:sessionId, options}

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


	/**
	 * @function get
	 * @description fetching session value for a given
	 * key
	 * @param  {String} key
	 * @return {*}
	 * @public
	 */
	* get (key) {

		/**
		 * pairs will be built by iterating over the session
		 * object and transforming values back to their
		 * original type.
		 * @type {Object}
		 */
		let pairs = {}

		/**
		 * reading cookies from request
		 */
		const cookies = Cookies.parse(this.request)

		/**
		 * looking for adonis-session key inside cookies
		 * @type {Object}
		 */
		let session = cookies['adonis-session']

		/**
		 * if session key does not exists inside cookie
		 * return null
		 */
		if(!session){
			return null
		}

		/**
		 * if driver is not cookie , we need to fetch values using sessionId
		 * from active driver
		 */
		if(this.constructor.driver !== 'cookie'){
			session = yield this.constructor.driver.read(session)
		}

		/**
		 * parsing it back to object.
		 * @type {Object}
		 */
		session = JSON.parse(session)

		pairs = _.object(_.map(session, function(item,index) {
			item = helpers.stringToType(item)
			return [item.d.key,item.d.value]
		}))

		return pairs[key]

	}

}

module.exports = SessionManager
