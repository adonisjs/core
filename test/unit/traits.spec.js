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
const { ioc } = require('@adonisjs/fold')
const HashTrait = require('../../src/Traits/Hash')

test.group('Traits | Hash', () => {
  test('add hash fake to ioc container', async (assert) => {
    const suite = {}

    suite.callbacks = {
      before: null,
      after: null
    }

    suite.before = function (callback) {
      this.callbacks.before = callback
    }

    suite.after = function (callback) {
      this.callbacks.after = callback
    }

    HashTrait(suite)
    suite.callbacks.before()
    const hashed = await ioc.use('Adonis/Src/Hash').make('foo')
    assert.equal(hashed, 'foo')
    suite.callbacks.after()
    assert.isFalse(ioc._hasFake('Adonis/Src/Hash'))
  })
})
