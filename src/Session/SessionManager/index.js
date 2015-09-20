'use strict'

/**
 * adonis-framework 
 * Copyright(c) - Harminder Virk
 * MIT Licensed
*/

const Keygrip = require('keygrip')

class SessionManager {

	static get sessionKey(){
		return 'adonis-session'
	}

	constructor(request, response) {
		this.request = request
		this.response = response
		this.keys = new Keygrip(this.constructor.appKey)
	}

	/**
	 * @function put
	 * @description Add new value for existing
	 * session for a given user.
	 * @param  {String} key
	 * @param  {*} value
	 * @return {void}
	 */
	*put (key,value) {
		const session = this.request.cookie(this.constructor.sessionKey)
			
		/**
		 * if driver for session management is set
		 * to cookie , then parse values via
		 * cookie.
		 */
		if(this.constructor.driver === 'cookie'){

			if(session){
				
			}

		}
	}

	*get (key) {
	}

}

module.exports = SessionManager