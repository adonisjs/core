'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
 */

const Hash = require('../../src/Hash')
const chai = require('chai')
const expect = chai.expect
require('co-mocha')

describe('Hashing', function () {
  it('should hash a value using make method', function * () {
    yield Hash.make('foo')
  })
  it('should compare hash value using make method', function * () {
    const hashed = yield Hash.make('foo')
    const verified = yield Hash.verify('foo', hashed)
    expect(verified).to.equal(true)
  })
  it('should return false when wrong values are passed', function * () {
    const hashed = yield Hash.make('foo')
    const verified = yield Hash.verify('bar', hashed)
    expect(verified).to.equal(false)
  })
  it('should throw error when wrong values are passed during make method', function * () {
    try {
      yield Hash.make('foo', 'bar')
      expect(true).to.equal(false)
    } catch (e) {
      expect(e.message).to.match(/Invalid salt version/)
    }
  })

  it('should throw error when wrong values are passed during verify method', function * () {
    try {
      yield Hash.verify('foo')
      expect(true).to.equal(false)
    } catch (e) {
      expect(e.message).to.match(/Illegal arguments/)
    }
  })
})
