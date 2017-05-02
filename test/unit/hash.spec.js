'use strict'

<<<<<<< 21ebc8a4ce18da16c1d4167b3c09b81eb77967b5
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
=======
/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const Hash = require('../../src/Hash')

test.group('Hash', () => {
  test('hash value', async (assert) => {
    const hashed = await Hash.make('foo')
    assert.isDefined(hashed)
  })

  test('return true when hash matches', async (assert) => {
    const hashed = await Hash.make('foo')
    const verified = await Hash.verify('foo', hashed)
    assert.isTrue(verified)
  })

  test('return false when hash does not match', async (assert) => {
    const hashed = await Hash.make('foo')
    const verified = await Hash.verify('bar', hashed)
    assert.isFalse(verified)
  })

  test('return false instead of throwing exception', async (assert) => {
    const hashed = await Hash.make('foo')
    const verified = await Hash.verify(undefined, hashed)
    assert.isFalse(verified)
>>>>>>> feat(hash): add hash provider
  })
})
