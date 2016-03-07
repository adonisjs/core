'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const Encryption = require('../../src/Encryption')
const chai = require('chai')
const crypto = require('crypto')
const expect = chai.expect
let encryption

const Config = {
  get: function (key) {
    if(key === 'app.appKey'){
      return 'bubblegum'
    }
    if(key === 'app.encryption.algorithm'){
      return 'aes-256-cbc'
    }
  }
}

describe('Encryption', function() {

  before(function () {
    encryption = new Encryption(Config)
  })

  it('should throw error when APP_KEY is not defined', function () {
    const fn = function () {
      return new Encryption({get: function () {}})
    }
    expect(fn).to.throw(/Encryption cannot work without application key/i)
  })

  it('should encryption values using defined algorithm', function () {
    const cipher = crypto.createCipher(Config.get('app.encryption.algorithm'),Config.get('app.appKey'))
    let encrypted = cipher.update('These Aren\'t the Droids You\'re Looking For', 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const encryptedFromClass = encryption.encrypt('These Aren\'t the Droids You\'re Looking For')
    expect(encryptedFromClass).to.equal(encrypted)
  })

  it('should decrypt values using defined algorithm', function () {
    const encrypted = encryption.encrypt('These Aren\'t the Droids You\'re Looking For')
    const decrypted = encryption.decrypt(encrypted)
    expect(decrypted).to.equal('These Aren\'t the Droids You\'re Looking For')
  })

  it('should throw error when decryption fails', function () {
    const fn = function () {
      return encryption.decrypt('foo')
    }
    expect(fn).to.throw(/Bad input/)
  })

});
