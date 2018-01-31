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
const { setupResolver } = require('@adonisjs/sink')
const Exception = require('../../src/Exception')

test.group('Exception', (group) => {
  group.before(() => {
    setupResolver()
  })

  group.beforeEach(() => {
    ioc.restore()
    Exception.clear()
  })

  test('register handler for a given exception', (assert) => {
    const fn = function () {}
    Exception.handle('UserNotFoundException', fn)
    assert.deepEqual(Exception._handlers, { UserNotFoundException: fn })
  })

  test('register reporter for a given exception', (assert) => {
    const fn = function () {}
    Exception.report('UserNotFoundException', fn)
    assert.deepEqual(Exception._reporters, { UserNotFoundException: fn })
  })

  test('resolve handler when registered', (assert) => {
    const fn = function () {}
    Exception.handle('UserNotFoundException', fn)
    assert.deepEqual(Exception.getHandler('UserNotFoundException').method, fn)
  })

  test('resolve handler when is an IoC container reference', (assert) => {
    class Foo {
      bar () {}
    }

    ioc.bind('Handlers/Foo', function () {
      return new Foo()
    })

    Exception.handle('UserNotFoundException', 'Handlers/Foo.bar')
    assert.instanceOf(Exception.getHandler('UserNotFoundException').instance, Foo)
  })

  test('resolve reporter when registered', (assert) => {
    const fn = function () {}
    Exception.report('UserNotFoundException', fn)
    assert.deepEqual(Exception.getReporter('UserNotFoundException').method, fn)
  })

  test('resolve reporter when is an IoC container reference', (assert) => {
    class Foo {
      bar () {}
    }

    ioc.bind('Handlers/Foo', function () {
      return new Foo()
    })

    Exception.report('UserNotFoundException', 'Handlers/Foo.bar')
    assert.instanceOf(Exception.getReporter('UserNotFoundException').instance, Foo)
  })

  test('return undefined when no reporter is defined', (assert) => {
    assert.isUndefined(Exception.getReporter('UserNotFoundException'))
  })

  test('return undefined when no handler is defined', (assert) => {
    assert.isUndefined(Exception.getHandler('UserNotFoundException'))
  })
})
