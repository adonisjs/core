'use strict'

const test = require('japa')
const Macroable = require('../../src/Macroable')

test.group('Macroable', (group) => {
  group.beforeEach(() => {
    Macroable.hydrate()
  })

  test('define a macro', (assert) => {
    const fooFn = function () {}
    Macroable.macro('foo', fooFn)
    assert.equal(Macroable.getMacro('foo'), fooFn)
    assert.equal(new Macroable().foo, fooFn)
  })

  test('define an async macro', (assert) => {
    const fooFn = async function () {}
    Macroable.macro('foo', fooFn)
    assert.equal(Macroable.getMacro('foo'), fooFn)
    assert.equal(new Macroable().foo, fooFn)
  })

  test('throw exception when macro is not a function', (assert) => {
    const fooFn = 'foo'
    const fn = () => Macroable.macro('foo', fooFn)
    assert.throw(fn, 'E_INVALID_PARAMETER: Macroable.macro expects callback to be a function or an asyncFunction')
  })

  test('return false from {hasMacro} for unregistered macro', (assert) => {
    assert.equal(Macroable.hasMacro('foo'), false)
  })

  test('return true from {hasMacro} for registered macro', (assert) => {
    Macroable.macro('foo', function () {})
    assert.equal(Macroable.hasMacro('foo'), true)
  })

  test('return false when removed macro from prototype', (assert) => {
    Macroable.macro('foo', function () {})
    Reflect.deleteProperty(Macroable.prototype, 'foo')
    assert.equal(Macroable.hasMacro('foo'), false)
  })

  test('define a getter', (assert) => {
    Macroable.getter('foo', function () {
      return 'bar'
    })
    assert.equal(new Macroable().foo, 'bar')
  })

  test('return false from {hasGetter} for unregistered getter', (assert) => {
    assert.equal(Macroable.hasGetter('foo'), false)
  })

  test('return true from {hasGetter} for registered getter', (assert) => {
    Macroable.getter('foo', function () {})
    assert.equal(Macroable.hasGetter('foo'), true)
  })

  test('return false when removed getter from prototype', (assert) => {
    Macroable.getter('foo', function () {})
    Reflect.deleteProperty(Macroable.prototype, 'foo')
    assert.equal(Macroable.hasGetter('foo'), false)
  })

  test('should be called everytime when fetched', (assert) => {
    let calledCount = 0
    Macroable.getter('foo', function () {
      calledCount++
      return 'bar'
    })
    /* eslint no-new: "off" */
    assert.equal(new Macroable().foo, 'bar')
    assert.equal(new Macroable().foo, 'bar')
    assert.equal(calledCount, 2)
  })

  test('throw exception when getter is not a function', (assert) => {
    const fooFn = 'foo'
    const fn = () => Macroable.getter('foo', fooFn)
    assert.throw(fn, 'E_INVALID_PARAMETER: Macroable.getter expects callback to be a function or an asyncFunction')
  })

  test('clean request object and temporary values on calling hydrate', (assert) => {
    Macroable.getter('foo', function () {})
    Macroable.macro('bar', function () {})
    Macroable.hydrate()
    assert.deepEqual(Macroable._macros, {})
    assert.deepEqual(Macroable._getters, {})
    assert.equal(new Macroable().foo, undefined)
    assert.equal(new Macroable().bar, undefined)
  })

  test('static methods should not be shared', (assert) => {
    class Foo extends Macroable {}
    Foo._macros = {}
    Foo._getters = {}

    class Bar extends Macroable {}
    Bar._macros = {}
    Bar._getters = {}

    Foo.macro('foo', function () {})
    assert.isFunction(Foo.getMacro('foo'))
    assert.isFunction(Foo.prototype.foo)
    assert.isUndefined(Bar.getMacro('foo'))
    assert.isUndefined(Bar.prototype.foo)
  })

  test('define a singleton getter', (assert) => {
    let getterCalledCounts = 0
    Macroable.getter('foo', function () {
      getterCalledCounts++
      return 'bar'
    }, true)
    const m = new Macroable()
    assert.equal(m.foo, 'bar')
    assert.equal(m.foo, 'bar')
    assert.equal(getterCalledCounts, 1)
  })

  test('singleton should be instance specific', (assert) => {
    let getterCalledCounts = 0
    Macroable.getter('foo', function () {
      getterCalledCounts++
      return 'bar'
    }, true)
    const m = new Macroable()
    const m1 = new Macroable()
    assert.equal(m.foo, 'bar')
    assert.equal(m.foo, 'bar')
    assert.equal(m1.foo, 'bar')
    assert.equal(m1.foo, 'bar')
    assert.equal(getterCalledCounts, 2)
  })
})
