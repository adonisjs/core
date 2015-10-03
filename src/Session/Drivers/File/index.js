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


	*read (sessionId) {

		const sessionFile = path.join(this.storagePath,sessionId)
		try{
			return yield coFs.readJSON(sessionFile)
		}catch(e){
			return null;
		}

	}

	*write (sessionId,data) {

		const sessionFile = path.join(this.storagePath,sessionId)
		return yield coFs.writeJson(sessionFile,data)

	}

}

module.exports = FileDriver
