'use strict'

/**
 * adonis-framework 
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const coFs = require('co-fs-extra')
const path = require('path')


class FileDriver {

	constructor (Helpers, Config){
		const sessionDir = Config.get('sessions.file.directory') || 'sessions/'
		this.storagePath = Helpers.storagePath(sessionDir)
		this.config = Config
	}


	/**
	 * @description reading session values from file for a
	 * given session id
	 * @method read
	 * @param  {String} sessionId
	 * @return {Object}
	 */
	* read (sessionId) {
		const sessionFile = path.join(this.storagePath,sessionId)
		try{
			return yield coFs.readJSON(sessionFile)
		}catch(e){
			return null;
		}
	}

	/**
	 * writing session value to a file with sessionid
	 * @method write
	 * @param  {String} sessionId
	 * @param  {Object} data
	 * @return {void}
	 */
	* write (sessionId,data) {
		const sessionFile = path.join(this.storagePath,sessionId)
		return yield coFs.writeJson(sessionFile,data)
	}

}

module.exports = FileDriver
