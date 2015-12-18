'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Encryption = require('../../src/Encryption')
const chai = require('chai')
const crypto = require('crypto')
const expect = chai.expect
let encryption

const Env = {
  get: function (key) {
    if(key === 'APP_KEY'){
      return 'bubblegum'
    }
    if(key === 'ENCRYPTION'){
      return 'aes-256-cbc'
    }
  }
}

describe('Encryption', function() {

  before(function () {
    encryption = new Encryption(Env)
  })

  it('should throw error when APP_KEY is not defined', function () {
    const fn = function () {
      return new Encryption({get: function () {}})
    }
    expect(fn).to.throw(/Encryption cannot work without APP_KEY/i)
  })

  it('should encryption values using defined algorithm', function () {
    const cipher = crypto.createCipher(Env.get('ENCRYPTION'),Env.get('APP_KEY'))
    cipher.update('virk')
    const encrypted = encryption.encrypt('virk')
    expect(encrypted).to.equal(cipher.final('hex'))
  })

  it('should decrypt values using defined algorithm', function () {
    const encrypted = encryption.encrypt('virk')
    const decrypted = encryption.decrypt(encrypted)
    expect(decrypted).to.equal('virk')
  })

  it('should throw error when decryption fails', function () {
    const fn = function () {
      return encryption.decrypt('foo')
    }
    expect(fn).to.throw(/Bad input/)
  })

});
