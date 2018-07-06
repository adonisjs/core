'use strict'

/*
 * adonis-fold
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed wtesth this source code.
*/

const path = require('path')
const test = require('japa')
const assert = require('chai').assert
const Ioc = require('../../src/Ioc')
require('../../index')

test.group('Ioc', function () {
  test('should be able to instantiate Ioc container', function () {
    const ioc = new Ioc()
    assert.instanceOf(ioc, Ioc)
  })

  test('should throw exception when callback is not passed to the bind method', function () {
    const ioc = new Ioc()
    const fn = () => ioc.bind('App/Foo')
    assert.throw(fn, 'Ioc.bind expects 2nd parameter to be a closure')
  })

  test('should be able to bind a namespace inside the bindings map', function () {
    const ioc = new Ioc()
    const fooFn = function () {}
    ioc.bind('App/Foo', fooFn)
    assert.deepEqual(ioc.getBindings()['App/Foo'].closure, fooFn)
  })

  test('should bind a namespace inside the bindings map and keep the singleton to false', function () {
    const ioc = new Ioc()
    const fooFn = function () {}
    ioc.bind('App/Foo', fooFn)
    assert.deepEqual(ioc.getBindings()['App/Foo'], { closure: fooFn, singleton: false, cachedValue: null })
  })

  test('should throw exception when callback is not passed to the singleton method', function () {
    const ioc = new Ioc()
    const fn = () => ioc.singleton('App/Foo')
    assert.throw(fn, 'Ioc.singleton expects 2nd parameter to be a closure')
  })

  test('should bind a namespace inside the bindings map using Ioc.singleton method', function () {
    const ioc = new Ioc()
    const fooFn = function () {}
    ioc.singleton('App/Foo', fooFn)
    assert.deepEqual(ioc.getBindings()['App/Foo'].closure, fooFn)
  })

  test('should bind a namespace inside the bindings map and set singleton to true when using Ioc.singleton method', function () {
    const ioc = new Ioc()
    const fooFn = function () {}
    ioc.singleton('App/Foo', fooFn)
    assert.deepEqual(ioc.getBindings()['App/Foo'], { closure: fooFn, singleton: true, cachedValue: null })
  })

  test('should return a clone of map when getBindings method is called', function () {
    const ioc = new Ioc()
    const fooFn = function () {}
    ioc.bind('App/Foo', fooFn)
    ioc.getBindings()['App/Foo'] = function () {}
    assert.deepEqual(ioc.getBindings()['App/Foo'], { closure: fooFn, singleton: false, cachedValue: null })
  })

  test('should be able to resolve binding using the namespace', function () {
    const ioc = new Ioc()
    const fooFn = function () {
      return 'foo'
    }
    ioc.bind('App/Foo', fooFn)
    const foo = ioc.use('App/Foo')
    assert.equal(foo, 'foo')
  })

  test('should call the closure n times a namespace is fetched via use method', function () {
    const ioc = new Ioc()
    let fooFnCalled = 0
    const fooFn = function () {
      fooFnCalled++
      return 'foo'
    }
    ioc.bind('App/Foo', fooFn)
    ioc.use('App/Foo')
    ioc.use('App/Foo')
    assert.equal(fooFnCalled, 2)
  })

  test('should call the closure only once and return the cached value when binded as a singleton', function () {
    const ioc = new Ioc()
    let fooFnCalled = 0
    const fooFn = function () {
      fooFnCalled++
      return 'foo'
    }
    ioc.singleton('App/Foo', fooFn)
    ioc.use('App/Foo')
    ioc.use('App/Foo')
    assert.equal(fooFnCalled, 1)
  })

  test('should be able to load a node module via the Ioc.use method', function () {
    const ioc = new Ioc()
    const chai = ioc.use('chai')
    assert.isDefined(chai)
  })

  test('should be able to load a local modules via Ioc.use method', function () {
    const ioc = new Ioc()
    const packageFile = ioc.use('../../package')
    assert.equal(packageFile.name, '@adonisjs/fold')
  })

  test('should be able to define aliases for bindings', function () {
    const ioc = new Ioc()
    const fooFn = function () {}
    ioc.bind('App/Foo', fooFn)
    ioc.alias('App/Foo', 'Foo')
    assert.equal(ioc.getAliases()['Foo'], 'App/Foo')
  })

  test('should be able to resolve bindings using alias', function () {
    const ioc = new Ioc()
    const fooFn = function () {
      return 'foo'
    }
    ioc.bind('App/Foo', fooFn)
    ioc.alias('App/Foo', 'Foo')
    const resolved = ioc.use('Foo')
    assert.equal(resolved, 'foo')
  })

  test('should be able to autoload a directory under a given namespace', function () {
    const ioc = new Ioc()
    ioc.autoload(path.join(__dirname, './app'), 'App')
    assert.equal(ioc.getAutoloads()['App'], path.join(__dirname, './app'))
  })

  test('should be able to call a closure when loading has been successful using with', (assert) => {
    assert.plan(1)
    const ioc = new Ioc()
    const fooFn = function () {
      return 'foo'
    }
    ioc.bind('App/Foo', fooFn)

    ioc.with('App/Foo', (Foo) => {
      assert.equal(Foo, 'foo')
    })
  })

  test('should be able to call a closure when loading has been successful using with', (assert) => {
    assert.plan(2)
    const ioc = new Ioc()
    const fooFn = function () {
      return 'foo'
    }
    const barFn = function () {
      return 'bar'
    }
    ioc.bind('App/Foo', fooFn)
    ioc.bind('App/Bar', barFn)

    ioc.with(['App/Foo', 'App/Bar'], (Foo, Bar) => {
      assert.equal(Foo, 'foo')
      assert.equal(Bar, 'bar')
    })
  })

  test('should fail silently when loading has been unsuccessful using with', (assert) => {
    assert.plan(1)
    const ioc = new Ioc()
    ioc.with(['App/Foo'], (Foo) => {
      assert.equal(true, false)
    })

    assert.equal(true, true)
  })

  test('should be able to resolve a file from the autoloaded directory', function () {
    const ioc = new Ioc()
    const actualUserClass = require('./app/User')
    ioc.autoload(path.join(__dirname, './app'), 'App')
    assert.deepEqual(ioc.use('App/User'), actualUserClass)
  })

  test('should be able to register multiple autoloaded directories', function () {
    const ioc = new Ioc()
    ioc.autoload(path.join(__dirname, './app/Blog'), 'Blog')
    ioc.autoload(path.join(__dirname, './app/Admin'), 'Admin')
    assert.equal(ioc.getAutoloads()['Blog'], path.join(__dirname, './app/Blog'))
    assert.equal(ioc.getAutoloads()['Admin'], path.join(__dirname, './app/Admin'))
  })

  test('should be able to resolve files from multiple autoloaded directories', function () {
    const ioc = new Ioc()
    ioc.autoload(path.join(__dirname, './app/Blog'), 'Blog')
    ioc.autoload(path.join(__dirname, './app/Admin'), 'Admin')
    assert.equal(ioc.use('Blog/User').name, 'BlogUser')
    assert.equal(ioc.use('Admin/User').name, 'AdminUser')
  })

  test('should not infer namespace as autoloaded, if the given namespace starts wtesth autoloaded namespace wtesthout /', function () {
    const ioc = new Ioc()
    ioc.autoload(path.join(__dirname, './app/Blog'), 'Blog')
    assert.equal(ioc._isAutoloadedPath('Blogger'), false)
  })

  test('should throw exception when manager does not have an extend method', function () {
    const ioc = new Ioc()
    const fn = () => ioc.manager('App/Foo', class Foo {})
    assert.throw(fn, 'E_INVALID_IOC_MANAGER: Make sure App/Foo does have a extend method. Report this issue to the provider author')
  })

  test('should be able to register a manager when manager has an extend method', function () {
    const ioc = new Ioc()
    class Foo {
      static extend () {}
    }
    ioc.manager('App/Foo', Foo)
    assert.deepEqual(ioc.getManagers()['App/Foo'], Foo)
  })

  test('should throw an exception when trying to extend a binding which does not have a manager', function () {
    const ioc = new Ioc()
    ioc.extend('App/Foo')
    const fn = () => ioc.executeExtendCalls()
    assert.throw(fn, 'E_CANNOT_EXTEND_BINDING: App/Foo cannot be extended, since their is no public interface to extend')
  })

  test('should throw an exception when trying to extend a binding and closure is not defined', function () {
    const ioc = new Ioc()
    ioc.manager('App/Foo', class Foo {
      static extend () {}
    })
    ioc.extend('App/Foo', 'redis')
    const fn = () => ioc.executeExtendCalls()
    assert.throw(fn, 'E_INVALID_PARAMETER: Ioc.extend expects 3rd parameter to be a closure')
  })

  test('should pass the closure value to the manager extend method', function () {
    const ioc = new Ioc()
    const extendedValues = {}

    class Foo {
      static extend (key, value) {
        extendedValues[key] = value
      }
    }

    ioc.manager('App/Foo', Foo)
    ioc.extend('App/Foo', 'redis', function () {
      return 'I am redis'
    })

    ioc.executeExtendCalls()
    assert.deepEqual(extendedValues, {redis: 'I am redis'})
  })

  test('should pass all extra options to the extend method of the manager', function () {
    const ioc = new Ioc()
    const extendedValues = {}

    class Foo {
      static extend (key, value, options) {
        extendedValues.options = options
      }
    }

    ioc.manager('App/Foo', Foo)
    ioc.extend('App/Foo', 'redis', function () {
      return 'I am redis'
    }, 'boom')

    ioc.executeExtendCalls()
    assert.deepEqual(extendedValues, {options: 'boom'})
  })

  test('should throw exception when a closure is not passed to the fake method', function () {
    const ioc = new Ioc()
    const fn = () => ioc.fake('App/Foo')
    assert.throw(fn, 'Ioc.fake expects 2nd parameter to be a closure')
  })

  test('should register the namespace fake', function () {
    const ioc = new Ioc()
    const fakeFn = function () {}
    ioc.fake('App/Foo', fakeFn)
    assert.deepEqual(ioc.getFakes().get('App/Foo'), { closure: fakeFn, singleton: false, cachedValue: null })
  })

  test('should register the singleton fake', function () {
    const ioc = new Ioc()
    const fakeFn = function () {}
    ioc.singletonFake('App/Foo', fakeFn)
    assert.deepEqual(ioc.getFakes().get('App/Foo'), { closure: fakeFn, singleton: true, cachedValue: null })
  })

  test('should resolve fake over the actual binding when registered', function () {
    const ioc = new Ioc()
    ioc.bind('App/Foo', function () {
      return 'foo'
    })
    ioc.fake('App/Foo', function () {
      return 'fake foo'
    })
    assert.equal(ioc.use('App/Foo'), 'fake foo')
  })

  test('should resolve same value when fake is singleton', function () {
    const ioc = new Ioc()
    class Foo {}

    ioc.bind('App/Foo', function () {
      return 'foo'
    })

    ioc.singletonFake('App/Foo', function () {
      return new Foo()
    })

    assert.isTrue(ioc.use('App/Foo') === ioc.use('App/Foo'))
  })

  test('should resolve fake over the actual binding when using make method', function () {
    const ioc = new Ioc()
    ioc.bind('App/Foo', function () {
      return 'foo'
    })
    ioc.fake('App/Foo', function () {
      return 'fake foo'
    })
    assert.equal(ioc.make('App/Foo'), 'fake foo')
  })

  test('should resolve fake over autoloaded path', function () {
    const ioc = new Ioc()
    ioc.autoload(path.join(__dirname, './app'), 'App')
    assert.equal(ioc.use('App/User').name, 'User')

    ioc.fake('App/User', function () {
      return 'fake user'
    })
    assert.equal(ioc.use('App/User'), 'fake user')
  })

  test('should resolve the actual binding when fake is cleared', function () {
    const ioc = new Ioc()
    ioc.bind('App/Foo', function () {
      return 'foo'
    })
    ioc.fake('App/Foo', function () {
      return 'fake foo'
    })
    ioc.restore('App/Foo')
    assert.equal(ioc.use('App/Foo'), 'foo')
  })

  test('should clear all fakes when parameter is passed to restore method', function () {
    const ioc = new Ioc()
    ioc.bind('App/Foo', function () {
      return 'foo'
    })
    ioc.fake('App/Foo', function () {
      return 'fake foo'
    })
    ioc.restore()
    assert.equal(ioc.getFakes().size, 0)
  })

  test('should clear multiple fakes when multiple namespaces have been passed to restore method', function () {
    const ioc = new Ioc()
    ioc.fake('App/Foo', function () {
      return 'fake foo'
    })
    ioc.fake('App/Bar', function () {
      return 'fake bar'
    })
    ioc.restore('App/Foo', 'App/Bar')
    assert.equal(ioc.getFakes().size, 0)
  })

  test('should clear multiple fakes when array of namespaces have been passed to restore method', function () {
    const ioc = new Ioc()
    ioc.fake('App/Foo', function () {
      return 'fake foo'
    })
    ioc.fake('App/Bar', function () {
      return 'fake bar'
    })
    ioc.restore(['App/Foo', 'App/Bar'])
    assert.equal(ioc.getFakes().size, 0)
  })

  test('should return the binding using make method', function () {
    const ioc = new Ioc()
    ioc.bind('App/Foo', function () {
      return 'foo'
    })
    assert.equal(ioc.make('App/Foo'), 'foo')
  })

  test('should return the binding using make method when alias is used', function () {
    const ioc = new Ioc()
    ioc.bind('App/Foo', function () {
      return 'foo'
    })
    ioc.alias('App/Foo', 'Foo')
    assert.equal(ioc.make('Foo'), 'foo')
  })

  test('should return the instance of class when namespace is a autoloaded path', function () {
    const ioc = new Ioc()
    const originalUser = require('./app/User')
    ioc.autoload(path.join(__dirname, './app'), 'App')
    assert.instanceOf(ioc.make('App/User'), originalUser)
  })

  test('should inject dependencies to the class when test has a static inject property', function () {
    const ioc = new Ioc()
    ioc.autoload(path.join(__dirname, './app'), 'App')
    ioc.bind('App/Foo', function () {
      return 'foo'
    })
    assert.equal(ioc.make('App/Bar').foo, 'foo')
  })

  test('should make instance of plain class', function () {
    const ioc = new Ioc()
    class Foo {}
    assert.instanceOf(ioc.make(Foo), Foo)
  })

  test('should make instance of plain class and inject dependencies to test', function () {
    const ioc = new Ioc()
    class Bar {
      static get inject () {
        return ['App/Foo']
      }

      constructor (foo) {
        this.foo = foo
      }
    }

    ioc.bind('App/Foo', function () {
      return 'foo'
    })
    assert.equal(ioc.make(Bar).foo, 'foo')
  })

  test('should fallback to require when namespace does not belongs to the Ioc container', function () {
    const ioc = new Ioc()
    assert.isDefined(ioc.make('chai').assert)
  })

  test('should be able to require local modules from the current file', function () {
    const ioc = new Ioc()
    assert.isDefined(ioc.use('./app/User').name, 'User')
  })

  test('should be able to require local modules from the current file using global use method', function () {
    assert.isDefined(use('./app/User').name, 'User')
  })

  test('should not make the class instance when class has a static property called makePlain', function () {
    const ioc = new Ioc()
    class Foo {
      static get makePlain () {
        return true
      }
    }
    assert.deepEqual(ioc.make(Foo), Foo)
  })

  test('should throw exception when a valid dot notated string is not passed to makeFunc', function () {
    const ioc = new Ioc()
    const fn = () => ioc.makeFunc('Foo')
    assert.throw(fn, 'E_INVALID_MAKE_STRING: Ioc.makeFunc expects a string in module.method format instead received Foo')
  })

  test('should throw exception when method is not found on the object', function () {
    const ioc = new Ioc()
    ioc.bind('Foo', function () {
      return {}
    })
    const fn = () => ioc.makeFunc('Foo.handle')
    assert.throw(fn, 'E_UNDEFINED_METHOD: Method handle missing on Foo')
  })

  test('should return the method and the instance when expression satisfies the requirements', function () {
    const ioc = new Ioc()
    const obj = {
      handle: function () {}
    }

    ioc.bind('Foo', function () {
      return obj
    })
    assert.deepEqual(ioc.makeFunc('Foo.handle').instance, obj)
    assert.isFunction(ioc.makeFunc('Foo.handle').method)
  })

  test('should call the Ioc hooks when defined on the autoloaded object', function () {
    const ioc = new Ioc()
    ioc.autoload(path.join(__dirname, './app'), 'App')
    const foo = ioc.use('App/Hook')
    assert.equal(foo.called, true)
  })

  test('ignore escaped . when calling makeFunc', function () {
    const ioc = new Ioc()
    const obj = {
      handle: function () {}
    }

    ioc.bind('Foo.Baz', function () {
      return obj
    })
    assert.deepEqual(ioc.makeFunc('Foo\\.Baz.handle').instance, obj)
    assert.isFunction(ioc.makeFunc('Foo\\.Baz.handle').method)
  })

  test('get path to the namespace file for a given directory', (assert) => {
    const ioc = new Ioc()
    ioc.autoload(path.join(__dirname, './app'), 'App')
    const hookPath = ioc.getPath('App/Hook')
    assert.equal(hookPath, path.join(__dirname, './app/Hook'))
  })

  test('throw exception when namespace is not part of autoloads', (assert) => {
    const ioc = new Ioc()
    ioc.autoload(path.join(__dirname, './app'), 'App')
    const hookPath = () => ioc.getPath('Foo/Hook')
    assert.throw(hookPath, 'E_CANNOT_GET_NAMESPACE_PATH: Cannot get path, since Foo/Hook is not a valid autoloaded namespace')
  })
})
