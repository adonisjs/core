'use strict'

const FileDriver = require('../../src/Session/Drivers/').file
const chai = require('chai')
const path = require('path')
const expect = chai.expect
const co = require('co')
const fs = require('fs')
const coFs = require('co-fs-extra')

const Helpers = {
	storagePath: function (dir) {
		return path.join(__dirname,'./storage/'+dir)
	}
}

const Config = {
	get: function() {
	}
}

const defaultSession = 'sessions/'
const sessionId = '19090'

describe('Session File Driver', function () {

	before(function(done) {

		co(function *() {
			yield coFs.emptyDir(Helpers.storagePath(defaultSession))
		}).then(done).catch(done)

	})

	it('should write to storage file when using read method', function (done) {
		const file = new FileDriver(Helpers,Config)

		co(function * () {
			yield file.write(sessionId,'hello world')
		}).then(function() {
			fs.readFile(path.join(Helpers.storagePath(defaultSession),sessionId),'utf8',function (error,r) {
				if(error){
					return done(error)
				}
				expect(r.trim().replace(/"/g,'')).to.equal('hello world')
				done()
			})
		}).catch(done)
	})

	it('should read values for a given session', function (done) {
		const file = new FileDriver(Helpers,Config)
		const sessionId = '19090'

		co(function * () {
			return yield file.read(sessionId)
		}).then(function(r) {
			expect(r.trim().replace(/"/g,'')).to.equal('hello world')
			done()
		}).catch(done)

	})

});
