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
const Context = require('../../src/Context')

test.group('Context', (group) => {
  group.beforeEach(() => {
    Context.hydrate()
  })

  test('it should accept onReady functions', (assert) => {
    const fn = function () {}
    Context.onReady(fn)
    assert.deepEqual(Context._readyFns, [fn])
  })

  test('execute onReady methods on new instance', (assert) => {
    let passedCtx = null

    const fn = function (ctx) {
      passedCtx = ctx
    }

    Context.onReady(fn)

    const ctx = new Context()
    assert.deepEqual(ctx, passedCtx)
  })

  test('ignore non function calls from onReady', (assert) => {
    let passedCtx = null

    const fn = function (ctx) {
      passedCtx = ctx
    }

    Context.onReady(null).onReady(fn)

    const ctx = new Context()
    assert.deepEqual(ctx, passedCtx)
  })
})
