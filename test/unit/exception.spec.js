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

  test('fetch handler from exception class', (assert) => {
    class FooBar {
      handle () {}
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    assert.property(Exception._handlers, 'UserNotFoundException')
    assert.isFunction(Exception._handlers.UserNotFoundException)
  })

  test('fetch handler and reporter from exception class', (assert) => {
    class FooBar {
      handle () {}
      report () {}
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    assert.property(Exception._handlers, 'UserNotFoundException')
    assert.isFunction(Exception._handlers.UserNotFoundException)
    assert.property(Exception._reporters, 'UserNotFoundException')
    assert.isFunction(Exception._reporters.UserNotFoundException)
  })

  test('class handle and report should have access to this', (assert) => {
    let name = null

    class FooBar {
      handle () {
        name = this.constructor.name
      }
      report () {}
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    Exception._handlers.UserNotFoundException()
    assert.equal(name, 'FooBar')
  })
})
