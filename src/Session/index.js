'use strict'

/**
 * adonis-framework 
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Drivers = require('./Drivers');
const SessionManager = require('./SessionManager')


/**
 * My job is to return an instance of Session Manager
 * with attached driver that will be used. Cookie 
 * based sessions do not need any driver and
 * are managed by Session Manager itself
 */
class Session {

	constructor(Helpers,Config) {

		/**
		 * grabbing session driver via
		 * Config facade
		 * @type {String}
		 */
		const driver = Config.get('session.driver')

		/**
		 * Setting up driver for SessionManager
		 * @type {[type]}
		 */
		SessionManager.driver = driver === 'cookie' ? 'cookie' : new Drivers[driver](Helpers,Config)

		/**
		 * return session Manager class
		 */
		return SessionManager

	}

}

module.exports = Session