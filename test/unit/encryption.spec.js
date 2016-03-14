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
let config
let encryption

class Config {
  constructor (key, algorithm) {
    this.key = key
    this.algorithm = algorithm || 'aes-256-cbc'
  }
  get (key) {
    if(key === 'app.appKey'){
      return this.key
    }
    if(key === 'app.encryption.algorithm'){
      return this.algorithm
    }
  }
}

describe('Encryption', function() {

  before(function () {
    config = new Config('a'.repeat(32), 'aes-256-cbc')
    encryption = new Encryption(config)
  })

  it('should throw error when APP_KEY is not defined', function () {
    const fn = function () {
      return new Encryption(new Config())
    }
    expect(fn).to.throw(/App key needs to be specific in order to make use of Encryption\./i)
  })

  it('should throw error when APP_KEY to long', function () {
    const fn = function () {
      return new Encryption(new Config('a'.repeat(32), 'aes-128-cbc'))
    }
    expect(fn).to.throw(/The only supported ciphers are AES-128-CBC and AES-256-CBC with the correct key lengths\./i)
  })

  it('should throw error when APP_KEY is wrong', function () {
    const fn = function () {
      return new Encryption(new Config('a'.repeat(5), 'aes-256-cbc'))
    }
    expect(fn).to.throw(/The only supported ciphers are AES-128-CBC and AES-256-CBC with the correct key lengths\./i)
  })

  it('should throw error when cipher is unsupported', function () {
    const fn = function () {
      return new Encryption(new Config('a'.repeat(16), 'AES-256-CFB8'))
    }
    expect(fn).to.throw(/The only supported ciphers are AES-128-CBC and AES-256-CBC with the correct key lengths\./i)
  })

  it('should throw error when APP_KEY length is wrong and cipher is unsupported', function () {
    const fn = function () {
      return new Encryption(new Config('a'.repeat(16), 'AES-256-CFB8'))
    }
    expect(fn).to.throw(/The only supported ciphers are AES-128-CBC and AES-256-CBC with the correct key lengths\./i)
  })

  it('should calculate a correct sha256 hash', function () {
    const hash = encryption.hash('These Aren\'t the Droids ', 'You\'re Looking For')
    expect(hash).to.equal(crypto.createHmac('sha256', config.get('app.appKey')).update('These Aren\'t the Droids You\'re Looking For').digest('hex'))
  })

  it('should calculate a correct sha256 hash using HMAC method', function () {
    const hmac = encryption.hashHmac('sha256', 'These Aren\'t the Droids You\'re Looking For', config.get('app.appKey'))
    expect(hmac).to.equal(crypto.createHmac('sha256', config.get('app.appKey')).update('These Aren\'t the Droids You\'re Looking For').digest('hex'))
  })

  it('should encode base64', function () {
    const base64 = encryption.base64Encode('These Aren\'t the Droids You\'re Looking For')
    expect(base64).to.equal('VGhlc2UgQXJlbid0IHRoZSBEcm9pZHMgWW91J3JlIExvb2tpbmcgRm9y')
  })

  it('should decode base64', function () {
    const plain = encryption.base64Decode('VGhlc2UgQXJlbid0IHRoZSBEcm9pZHMgWW91J3JlIExvb2tpbmcgRm9y')
    expect(plain).to.equal('These Aren\'t the Droids You\'re Looking For')
  })

  it('should detect valid payload', function () {
    const invalid = encryption.invalidPayload({iv:'', value:'', mac:''})
    expect(invalid).to.equal(false)
  })

  it('should detect valid mac', function () {
    const payload = {iv:'gD+wK78S1q4L3Vzgullp8Q==', value:'These Aren\'t the Droids You\'re Looking For', mac:'ffcfa6ced2727ba646467688e1f3ae0d38ccb7c5b4a9c6f9876d6d749100c2bd'}
    const invalid = encryption.validMac(payload)
    expect(invalid).to.equal(true)
  })

  it('should throw error when payload is invalid', function () {
    const fn = function () {
      return encryption.getJsonPayload('Int9Ig==')
    }
    expect(fn).to.throw(/The payload is invalid\./i)
  })

  it('should throw error when payload is not an json object', function () {
    const fn = function () {
      return encryption.getJsonPayload('foo')
    }
    expect(fn).to.throw(/The payload is not an json object\./i)
  })

  it('should throw error when mac is invalid', function () {
    let iv = crypto.randomBytes(16)
    const mac = encryption.hash(iv = encryption.base64Encode(iv), 'These Aren\'t the Droids You\'re Looking For')
    const json = JSON.stringify({iv: iv, value: 'These Are the Droids You\'re Looking For', mac: mac})
    const base64 = encryption.base64Encode(json)
    const fn = function () {
      return encryption.getJsonPayload(base64)
    }
    expect(fn).to.throw(/The MAC is invalid\./i)
  })

  it('should decrypt values using defined algorithm', function () {
    const encrypted = encryption.encrypt('These Aren\'t the Droids You\'re Looking For')
    const decrypted = encryption.decrypt(encrypted)
    expect(decrypted).to.equal('These Aren\'t the Droids You\'re Looking For')
  })

  it('should throw error with different keys', function () {
    const fn = function () {
      const a = new Encryption(new Config('a'.repeat(32), 'aes-256-cbc'))
      const b = new Encryption(new Config('b'.repeat(32), 'aes-256-cbc'))
      console.log(b.decrypt(a.encrypt('These Aren\'t the Droids You\'re Looking For')))
    }
    expect(fn).to.throw(/The MAC is invalid\./i)
  })

})
