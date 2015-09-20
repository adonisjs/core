'use strict'

/**
 * adonis-framework 
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Drivers = require('./Drivers');
const Manager = require('./SessionManager')


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
		Manager.driver = driver === 'cookie' ? 'cookie' : Drivers[driver](Helpers,Config)

		/**
		 * setting application key to encrypt values
		 */
		Manager.appKey = process.env.APP_KEY

		/**
		 * return session Manager class
		 */
		return Manager

	}

}

module.exports = Session