'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Event = require('../../src/Event')
const test = require('japa')
const { ioc } = require('@adonisjs/fold')
const { Config, setupResolver } = require('@adonisjs/sink')
const sleep = function (timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}

test.group('Events', (group) => {
  group.before(() => {
    setupResolver()
  })

  group.beforeEach(() => {
    ioc.restore()
  })

  test('newup events provider', (assert) => {
    const event = new Event(new Config())
    assert.isDefined(event.emitter)
  })

  test('bind a new listener', (assert, done) => {
    assert.plan(1)
    const event = new Event(new Config())
    const fn = function (val) {
      assert.equal(val, 'bar')
      done()
    }

    event.on('foo', fn)
    event.fire('foo', 'bar')
  })

  test('bind a listener only once', (assert, done) => {
    assert.plan(1)
    const event = new Event(new Config())
    const fn = function (val) {
      assert.equal(val, 'bar')
      done()
    }

    event.once('foo', fn)
    event.fire('foo', 'bar')
    event.fire('foo', 'bar')
  })

  test('bind listener as a ioc container namespace', (assert, done) => {
    assert.plan(1)
    const event = new Event(new Config())
    const Foo = {
      occurs: function (val) {
        assert.equal(val, 'bar')
        done()
      }
    }

    ioc.fake('App/Listeners/Foo', function () {
      return Foo
    })

    event.when('foo', 'Foo.occurs')
    event.fire('foo', 'bar')
  })

  test('remove listener binded as namespace', (assert) => {
    assert.plan(2)
    const event = new Event(new Config())
    const Foo = {
      occurs: function (val) {
      }
    }

    ioc.fake('App/Listeners/Foo', function () {
      return Foo
    })

    event.when('foo', 'Foo.occurs')
    assert.lengthOf(event.getListeners('foo'), 1)
    event.off('foo', 'Foo.occurs')
    assert.lengthOf(event.getListeners('foo'), 0)
  })

  test('remove listener binded as function', (assert) => {
    assert.plan(2)
    const event = new Event(new Config())
    const fn = function () {}

    event.when('foo', fn)
    assert.lengthOf(event.getListeners('foo'), 1)
    event.off('foo', fn)
    assert.lengthOf(event.getListeners('foo'), 0)
  })

  test('remove all listeners', (assert) => {
    assert.plan(2)
    const event = new Event(new Config())
    const fn = function () {}

    event.when('foo', fn)
    assert.lengthOf(event.getListeners('foo'), 1)
    event.removeAllListeners('foo')
    assert.lengthOf(event.getListeners('foo'), 0)
  })

  test('bind event to be fired for x times only', (assert) => {
    const event = new Event(new Config())
    let fired = 0
    const fn = function () {
      fired++
    }
    event.times(2).when('foo', fn)
    event.fire('foo')
    event.fire('foo')
    event.fire('foo')
    assert.equal(fired, 2)
  })

  test('bind an array of listeners', (assert) => {
    const event = new Event(new Config())
    const fn = function () {
    }
    event.when('foo', [fn, fn])
    assert.equal(event.listenersCount('foo'), 2)
  })

  test('return true when event has listeners', (assert) => {
    const event = new Event(new Config())
    const fn = function () {
    }
    event.once('foo', [fn, fn])
    assert.isTrue(event.hasListeners('foo'))
  })

  test('bind async function', (assert, done) => {
    const event = new Event(new Config())
    event.when('foo', async function (val) {
      await sleep(10)
      assert.equal(val, 'bar')
      done()
    })
    event.fire('foo', 'bar')
  })

  test('throw exception when times does not receives a number', (assert) => {
    const event = new Event(new Config())
    const fn = () => event.times('foo')
    assert.throw(fn, 'E_INVALID_PARAMETER: Event.times expects a valid number instead received {string:foo}')
  })

  test('throw exception when setMaxListeners does not receives a number', (assert) => {
    const event = new Event(new Config())
    const fn = () => event.setMaxListeners('foo')
    assert.throw(fn, 'E_INVALID_PARAMETER: Event.setMaxListeners expects a valid number instead received {string:foo}')
  })

  test('set max listeners', (assert) => {
    const event = new Event(new Config())
    event.setMaxListeners(2)
    assert.equal(event.emitter._conf.maxListeners, 2)
  })

  test('bind listener for any event', (assert) => {
    const event = new Event(new Config())
    const stack = []
    event.onAny(function (event) {
      stack.push(event)
    })
    event.fire('foo')
    event.fire('bar')
    assert.deepEqual(stack, ['foo', 'bar'])
  })

  test('bind listener for any event via ioc container', (assert) => {
    const event = new Event(new Config())
    const stack = []
    ioc.fake('App/Listeners/Event', () => {
      return {
        occurs: (event) => {
          stack.push(event)
        }
      }
    })
    event.onAny('Event.occurs')
    event.fire('foo')
    event.fire('bar')
    assert.deepEqual(stack, ['foo', 'bar'])
  })

  test('bind listener for any event via ioc container', (assert) => {
    const event = new Event(new Config())
    const stack = []
    ioc.fake('App/Listeners/Event', () => {
      return {
        occurs: (event) => {
          stack.push(event)
        }
      }
    })
    event.onAny('Event.occurs')
    event.fire('foo')
    event.fire('bar')
    assert.deepEqual(stack, ['foo', 'bar'])
  })

  test('remove listener for any event binded via ioc container', (assert) => {
    const event = new Event(new Config())
    const stack = []
    ioc.fake('App/Listeners/Event', () => {
      return {
        occurs: (event) => {
          stack.push(event)
        }
      }
    })
    event.any('Event.occurs')
    assert.lengthOf(event.getListenersAny(), 1)
    event.offAny('Event.occurs')
    assert.lengthOf(event.getListenersAny(), 0)
  })

  test('remove an array of listeners', (assert) => {
    const event = new Event(new Config())
    const fn = function () {
    }
    event.on('foo', [fn, fn])
    assert.equal(event.listenersCount('foo'), 2)
    event.off('foo', [fn, fn])
    assert.equal(event.listenersCount('foo'), 0)
  })

  test('remove listeners when times as crossed', (assert) => {
    const event = new Event(new Config())
    const fn = function () {
    }
    event.times(2).on('foo', [fn, fn])
    event.fire('foo')
    event.fire('foo')
    assert.equal(event.listenersCount('foo'), 0)
  })
})
