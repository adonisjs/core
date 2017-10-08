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
    assert.property(Exception._bindings, 'UserNotFoundException')
    assert.isFunction(Exception.getHandler('UserNotFoundException'))
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
    assert.property(Exception._bindings, 'UserNotFoundException')
    assert.isFunction(Exception.getHandler('UserNotFoundException'))
    assert.isFunction(Exception.getReporter('UserNotFoundException'))
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
    Exception.getHandler('UserNotFoundException')()
    assert.equal(name, 'FooBar')
  })

  test('newup exception class on each exception', (assert) => {
    let accessCounts = 0
    class FooBar {
      handle () {}
    }
    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      accessCounts++
      return foobar
    })

    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    Exception.getReporter('UserNotFoundException')
    Exception.getReporter('UserNotFoundException')
    assert.equal(accessCounts, 2)
  })

  test('give priority to exception binding', (assert) => {
    class FooBar {
      handle () {}
      report () {}
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    Exception.handle('UserNotFoundException', function inlineHandler () {})
    assert.notEqual(Exception.getHandler('UserNotFoundException').toString(), 'function inlineHandler() {}')
  })

  test('return inline handler when binding exists but method is missing', (assert) => {
    class FooBar {
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    const fn = function inlineHandler () {}
    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    Exception.handle('UserNotFoundException', fn)
    assert.deepEqual(Exception.getHandler('UserNotFoundException'), fn)
  })

  test('return wildcard handle when nothing exists', (assert) => {
    class FooBar {
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    const fn = function wildcardHandler () {}
    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    Exception.handle('*', fn)
    assert.deepEqual(Exception.getHandler('UserNotFoundException'), fn)
  })

  test('do not return wildcard when ignoreWildCard is set to true', (assert) => {
    class FooBar {
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    Exception.handle('*', function wildcardHandler () {})
    assert.isUndefined(Exception.getHandler('UserNotFoundException', true))
  })

  test('give priority to exception binding when resolving reporter', (assert) => {
    class FooBar {
      handle () {}
      report () {}
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    Exception.report('UserNotFoundException', function inlineReporter () {})
    assert.notEqual(Exception.getReporter('UserNotFoundException').toString(), 'function inlineReporter() {}')
  })

  test('return inline reporter when report method is not defined on binding', (assert) => {
    class FooBar {
      handle () {}
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    const fn = function inlineReporter () {}
    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    Exception.report('UserNotFoundException', fn)
    assert.deepEqual(Exception.getReporter('UserNotFoundException'), fn)
  })

  test('return wildcard reporter when nothing exists', (assert) => {
    class FooBar {
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    const fn = function wildcardReporter () {}
    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    Exception.report('*', fn)
    assert.deepEqual(Exception.getReporter('UserNotFoundException'), fn)
  })

  test('return undefined when ignoreWildCard is set to true', (assert) => {
    class FooBar {
    }

    const foobar = new FooBar()

    ioc.fake('Foo/Bar', function () {
      return foobar
    })

    Exception.bind('UserNotFoundException', '@provider:Foo/Bar')
    Exception.report('*', function wildcardReporter () {})
    assert.isUndefined(Exception.getReporter('UserNotFoundException', true))
  })
})
