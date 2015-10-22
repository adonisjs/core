'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const expect = chai.expect
const fs = require('fs')
const FileDriver = require('../../src/Session/Drivers').file

const Helpers = {
  storagePath : function() {
    return __dirname + '/storage/sessions'
  }
}

const Config = {
  get:function() {
    return 'sessions'
  }
}

const readFile = function (filePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, function (err, contents) {
      if(err){
        return reject(err)
      }
      resolve(contents.toString())
    })
  })
}

require('co-mocha')

describe('Session File Driver', function  () {

  it('should create session directory if does not exists', function * () {
    const fileDriver = new FileDriver(Helpers, Config)
    yield fileDriver._makeStorageDir(__dirname+'/storage/sessions')
  })

  it('should create file and write data to it', function * () {
    const fileDriver = new FileDriver(Helpers, Config)
    const filePath = __dirname+'/storage/sessions/102102201'
    yield fileDriver._writeSessionToFile(filePath,'hello world')
    const contents = yield readFile(filePath)
    expect(contents).to.equal('hello world')
  })

  it('should throw an error when unable to create file', function * () {
    const fileDriver = new FileDriver(Helpers, Config)
    const filePath = __dirname+'/storage/foo/102102201'
    try{
      yield fileDriver._writeSessionToFile(filePath,'hello world')
    }catch(e){
      expect(e.message).to.match(/no such file/)
    }
  })

  it('save session values using put method', function * () {
    const fileDriver = new FileDriver(Helpers, Config)
    const sessionId = '102102201'
    yield fileDriver.write(sessionId,'bye world')
    const contents = yield readFile(__dirname+'/storage/sessions/'+sessionId)
    expect(contents).to.equal('bye world')
  })

  it('should make use of sessions directory when no directory is specified under config', function * () {
    Config.get = function () {
      return null
    }
    const fileDriver = new FileDriver(Helpers, Config)
    const sessionId = '102102201'
    yield fileDriver.write(sessionId,'bye world')
    const contents = yield readFile(__dirname+'/storage/sessions/'+sessionId)
    expect(contents).to.equal('bye world')
  })

  it('should read session value from a given file', function * () {
    Config.get = function () {
      return null
    }
    const fileDriver = new FileDriver(Helpers, Config)
    const sessionId = '102102201'
    yield fileDriver.write(sessionId,JSON.stringify({name:"virk"}))
    const contents = yield fileDriver.read(sessionId)
    expect(contents).deep.equal({name:"virk"})
  })

  it('should return empty object when unable to read file', function * () {
    Config.get = function () {
      return null
    }
    const fileDriver = new FileDriver(Helpers, Config)
    const sessionId = '102102201'
    yield fileDriver.write(sessionId,JSON.stringify({name:"virk"}))
    const contents = yield fileDriver.read('102102202')
    expect(contents).deep.equal({})
  })

})
