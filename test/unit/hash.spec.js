'use strict'

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
  })
})
