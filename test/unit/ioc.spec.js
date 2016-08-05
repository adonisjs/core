'use strict'

/* global describe, it, context,beforeEach */
/**
 * adonis-fold
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Ioc = require('../../').Ioc
const chai = require('chai')
const expect = chai.expect
const path = require('path')

describe('Ioc', function () {
  beforeEach(function () {
    Ioc.new()
  })

  context('Providers', function () {
    it('should bind namespace to a given closure', function () {
      Ioc.bind('App/Foo', function () {
        return 'bar'
      })
      expect(Ioc.getProviders()['App/Foo'].closure).to.be.a('function')
      expect(Ioc.getProviders()['App/Foo'].closure()).to.equal('bar')
    })

    it('should return an error when closure is not passed to bind method', function () {
      const fn = function () {
        return Ioc.bind('App/Foo', 'bar')
      }
      expect(fn).to.throw(/Invalid arguments/)
    })

    it('should be able to inject other depedencies', function () {
      Ioc.bind('App/Bar', function () {
        return 'bar'
      })
      Ioc.bind('App/Foo', function (app) {
        return app.use('App/Bar')
      })
      expect(Ioc.use('App/Foo')).to.equal('bar')
    })

    it("should add manager with a namespace and it's defination", function () {
      class Foo {
        static extend () {}
      }
      Ioc.manager('App/Foo', Foo)
      expect(Ioc.getManagers()['App/Foo']).deep.equal(Foo)
    })

    it('should pass all the extend arguments to the manager extend method', function () {
      let extendArgs = {}
      class Foo {
        static extend () {
          extendArgs = arguments
        }
      }
      Ioc.manager('App/Foo', Foo)
      Ioc.bind('App/Foo', function () {
        return new Foo()
      })
      Ioc.extend('App/Foo', 'bar', function () {
        return {}
      }, 'baz')
      Ioc.use('App/Foo')
      expect(extendArgs['0']).to.equal('bar')
      expect(extendArgs['1']).deep.equal({})
      expect(extendArgs['2']).to.equal('baz')
    })

    it('should throw an error when manager does not have extend method', function () {
      class Foo {
      }
      const fn = function () {
        return Ioc.manager('App/Foo', Foo)
      }
      expect(fn).to.throw(/Incomplete implementation/g)
    })

    it('should be able to extend provider even if the actual provider does not exists', function () {
      class Session {
        static extend () {}
      }
      Ioc.extend('Adonis/Test/Session', 'redis', function () {
        return Session
      })
      expect(Ioc.getExtenders()['Adonis/Test/Session']).to.be.an('array')
      expect(Ioc.getExtenders()['Adonis/Test/Session'][0]).to.be.an('object')
      expect(Ioc.getExtenders()['Adonis/Test/Session'][0].key).to.equal('redis')
      expect(Ioc.getExtenders()['Adonis/Test/Session'][0].closure()).to.equal(Session)
    })

    it('should be able to have multiple extenders for a given provider', function () {
      class Session {
        static extend () {}
      }
      class Mongo {
        static extend () {}
      }
      Ioc.extend('Adonis/Test/Session', 'redis', function () {
        return Session
      })
      Ioc.extend('Adonis/Test/Session', 'mongo', function () {
        return Mongo
      })
      expect(Ioc.getExtenders()['Adonis/Test/Session']).to.be.an('array')
      expect(Ioc.getExtenders()['Adonis/Test/Session'][0]).to.be.an('object')
      expect(Ioc.getExtenders()['Adonis/Test/Session'][0].key).to.equal('redis')
      expect(Ioc.getExtenders()['Adonis/Test/Session'][0].closure()).to.equal(Session)
      expect(Ioc.getExtenders()['Adonis/Test/Session'][1]).to.be.an('object')
      expect(Ioc.getExtenders()['Adonis/Test/Session'][1].key).to.equal('mongo')
      expect(Ioc.getExtenders()['Adonis/Test/Session'][1].closure()).to.equal(Mongo)
    })

    it('should remove the extender once it has been attached to the provider', function () {
      let extendCalledCounts = 0
      class Session {
        static extend () {}
      }
      class SessionManager {
        static extend () {
          extendCalledCounts++
        }
      }
      Ioc.extend('Adonis/Test/Session', 'redis', function () {
        return Session
      })
      Ioc.manager('Adonis/Test/Session', SessionManager)
      Ioc.bind('Adonis/Test/Session', function () {
        return {}
      })
      expect(Ioc.getExtenders()['Adonis/Test/Session']).to.be.an('array')
      expect(Ioc.getExtenders()['Adonis/Test/Session'][0]).to.be.an('object')
      expect(Ioc.getExtenders()['Adonis/Test/Session'][0].key).to.equal('redis')
      Ioc.use('Adonis/Test/Session')
      Ioc.use('Adonis/Test/Session')
      expect(extendCalledCounts).to.equal(1)
      expect(Ioc.getExtenders()['Adonis/Test/Session']).to.have.length(0)
    })

    it('make sure one time extend call is not breaking the binding lifecycle', function () {
      class RedisSession {
      }
      class SessionManager {
        static extend (name, value) {
          this.drivers = this.drivers || {}
          this.drivers[name] = value
        }
      }
      Ioc.extend('Adonis/Test/Session', 'redis', function () {
        return RedisSession
      })
      Ioc.manager('Adonis/Test/Session', SessionManager)
      Ioc.bind('Adonis/Test/Session', function () {
        return new SessionManager()
      })
      const session1 = Ioc.use('Adonis/Test/Session')
      expect(session1.constructor.drivers).to.have.property('redis')
      const session2 = Ioc.use('Adonis/Test/Session')
      expect(session2.constructor.drivers).to.have.property('redis')
    })

    it('make sure extenders are getting called even when trying to resolve provider using alias', function () {
      class RedisSession {
      }
      class SessionManager {
        static extend (name, value) {
          this.drivers = this.drivers || {}
          this.drivers[name] = value
        }
      }
      Ioc.extend('Adonis/Test/Session', 'redis', function () {
        return RedisSession
      })
      Ioc.manager('Adonis/Test/Session', SessionManager)
      Ioc.bind('Adonis/Test/Session', function () {
        return new SessionManager()
      })
      Ioc.alias('Session', 'Adonis/Test/Session')
      const session = Ioc.use('Session')
      expect(session.constructor.drivers).to.have.property('redis')
    })

    it('should be able to fetch binding from ioc container using use method', function () {
      class Foo {
      }
      Ioc.bind('App/Foo', function () {
        return Foo
      })
      expect(Ioc.use('App/Foo')).deep.equal(Foo)
    })

    it('should be able to fetch binding from ioc container with type hinted depedencies', function () {
      class Foo {
        /*eslint-disable camelcase*/
        constructor (App_Bar) {
          this.bar = App_Bar
        }
      }
      class Bar {
      }

      Ioc.bind('App/Bar', function () {
        return new Bar()
      })

      Ioc.bind('App/Foo', function (app) {
        return new Foo(app.use('App/Bar'))
      })

      const foo = Ioc.use('App/Foo')
      expect(foo.bar instanceof Bar).to.equal(true)
    })

    it('should be able to bind instances as singleton', function () {
      class Foo {
        constructor () {
          this.items = []
        }
        add () {
          this.items.push('test')
        }
      }
      Ioc.singleton('App/Foo', function () {
        return new Foo()
      })

      const foo1 = Ioc.use('App/Foo')
      foo1.add()
      const foo2 = Ioc.use('App/Foo')
      expect(foo1.items).deep.equal(foo2.items)
    })
  })

  context('Autoloading', function () {
    it('should to be able to autoload directory under a given namespace', function () {
      const namespace = 'App'
      const directory = path.join(__dirname, './app')
      Ioc.autoload(namespace, directory)
      expect(Ioc.use('App/Http/routes')).to.equal('routes')
    })

    it('should to throw an error when unable to require file', function () {
      const namespace = 'App'
      const directory = path.join(__dirname, './app')
      Ioc.autoload(namespace, directory)
      const fn = function () {
        return Ioc.use('App/Http/foo')
      }
      expect(fn).to.throw(/Cannot find module/)
    })
  })

  context('Manager', function () {
    it('should to be extend manager instance of a provider', function () {
      class Foo {
        static extend () {}
      }

      class Mongo {
        constructor () {
          this.name = 'mongo'
        }
      }
      Ioc.manager('App/Foo', Foo)

      Ioc.extend('App/Foo', 'mongo', function () {
        return new Mongo()
      })

      expect(Ioc.getExtenders()['App/Foo'][0]).to.be.an('object')
      expect(Ioc.getExtenders()['App/Foo'][0].key).to.equal('mongo')
    })

    it('should extend provider before resolving it', function () {
      class Cache {
        static drivers () {}

        constructor () {
          return this.constructor.drivers.redis
        }

        static extend (key, defination) {
          this.drivers[key] = defination
        }
      }

      class Redis {
      }

      Ioc.manager('App/Cache', Cache)

      Ioc.bind('App/Cache', function () {
        return new Cache()
      })

      Ioc.extend('App/Cache', 'redis', function () {
        return new Redis()
      })

      expect(Ioc.use('App/Cache') instanceof Redis).to.equal(true)
    })

    it('should throw an error when trying to extend provider without a callback', function () {
      const fn = function () {
        return Ioc.extend('App/Cache', 'redis', 'Redis')
      }
      expect(fn).to.throw(/Invalid arguments, extend expects a callback/)
    })
  })

  context('Make', function () {
    it('should make an instance of class when there are no injections', function () {
      class Redis {
      }
      const redis = Ioc.make(Redis)
      expect(redis instanceof Redis).to.equal(true)
    })

    it('should make an instance of class when there are injections to be typhinted from constructor', function () {
      class Foo {
      }
      Ioc.bind('App/Foo', function () {
        return new Foo()
      })
      class Redis {
        constructor (App_Foo) {
          this.foo = App_Foo
        }
      }

      const redis = Ioc.make(Redis)
      expect(redis.foo instanceof Foo).to.equal(true)
    })

    it('should make an instance of class when there are injections injected via inject method', function () {
      class Foo {
      }

      Ioc.bind('App/Foo', function () {
        return new Foo()
      })

      class Redis {

        static get inject () {
          return ['App/Foo']
        }

        constructor (Foo) {
          this.foo = Foo
        }

      }

      const redis = Ioc.make(Redis)
      expect(redis.foo instanceof Foo).to.equal(true)
    })

    it('should be able to make nested classes', function () {
      class Bar {
      }

      Ioc.bind('App/Bar', function () {
        return new Bar()
      })

      class Foo {
        constructor (Bar) {
          this.bar = Bar
        }
      }

      Ioc.bind('App/Foo', function (app) {
        return new Foo(app.use('App/Bar'))
      })

      class Redis {
        static get inject () {
          return ['App/Foo']
        }
        constructor (Foo) {
          this.foo = Foo
        }
      }

      const redis = Ioc.make(Redis)
      expect(redis.foo instanceof Foo).to.equal(true)
      expect(redis.foo.bar instanceof Bar).to.equal(true)
    })

    it('should be able to deep inject classes from autoloaded path', function () {
      Ioc.autoload('App', path.join(__dirname, '/app'))

      class Foo {
        static get inject () {
          return ['App/Services/Service']
        }
        constructor (Service) {
          this.services = Service
        }
      }

      const foo = Ioc.make(Foo)
      expect(foo.services.bar).to.equal('bar')
      expect(foo.services.baz).to.equal('baz')
    })

    it('should not make anything other then a class', function () {
      const result = Ioc.make({})
      expect(result).deep.equal({})
    })

    it('should make complexed Classes which has multiple dependencies', function () {
      Ioc.autoload('App', path.join(__dirname, './app'))

      class FooProvider {
      }
      Ioc.bind('App/Providers/Foo', function () {
        return new FooProvider()
      })

      const userController = Ioc.make('App/Http/Controllers/UserController')
      expect(userController.foo instanceof FooProvider).to.equal(true)
      expect(userController.time).to.equal('time')
    })

    it('should throw an error, when unable to resolve binding using makeFunc', function () {
      const fn = function () {
        return Ioc.makeFunc('App/Baz.bar')
      }
      expect(fn).to.throw(/Cannot find module/)
    })

    it('should throw an error, when makeFunc string is not properly formatted', function () {
      const fn = function () {
        return Ioc.makeFunc('App/Baz')
      }
      expect(fn).to.throw(/Unable to make/)
    })

    it('should throw an error, when function does not exists on class', function () {
      Ioc.autoload('App', path.join(__dirname, './app'))
      const fn = function () {
        return Ioc.makeFunc('App/Services/Service.hello')
      }
      expect(fn).to.throw(/hello does not exists/)
    })

    it('should return class instance and method using makeFunc method', function () {
      Ioc.bind('App/Providers/Foo', function () {
        return {}
      })
      Ioc.bind('App/Providers/time', function () {
        return {}
      })
      Ioc.autoload('App', path.join(__dirname, './app'))
      const userController = Ioc.makeFunc('App/Http/Controllers/UserController.hello')
      expect(userController.instance[userController.method]()).to.equal('hello world')
    })
  })

  context('Global', function () {
    it('should throw an error, when unable to resolve depedency from ioc container', function () {
      const fn = function () {
        return Ioc.use('Bar')
      }
      expect(fn).to.throw(/Cannot find module/)
    })

    it('should require node module using use function', function () {
      const lodash = Ioc.use('lodash')
      expect(lodash.each).to.be.a('function')
    })

    it('should be able to alias any binding inside ioc container', function () {
      class Foo {
      }
      Ioc.bind('App/Foo', function () {
        return new Foo()
      })
      Ioc.alias('Foo', 'App/Foo')
      expect(Ioc.use('Foo') instanceof Foo).to.equal(true)
    })

    it('should be able to alias binding using an object', function () {
      class Foo {
      }
      Ioc.bind('App/Foo', function () {
        return new Foo()
      })
      Ioc.aliases({'Foo': 'App/Foo'})
      expect(Ioc.use('Foo') instanceof Foo).to.equal(true)
    })

    it('should call hooks for an autoloaded dependency', function () {
      Ioc.autoload('App', path.join(__dirname, './app'))
      const hook = Ioc.use('App/Services/Hook')
      expect(hook.called).to.equal(true)
    })

    it('should not call a hook if hook is not a function', function () {
      Ioc.autoload('App', path.join(__dirname, './app'))
      const hook = Ioc.use('App/Services/FakeHook')
      expect(hook.called).to.equal(undefined)
    })

    it('should make the instance of a class when makePlain is defined to true', function () {
      class User {
        static get prop () {
          return 'i am prop'
        }
        static get makePlain () {
          return true
        }
      }
      const makeUser = Ioc.make(User)
      expect(makeUser.prop).to.equal('i am prop')
    })
  })

  context('Events', function () {
    it('should fire an event when a binding is registered', function () {
      const binding = {}
      Ioc.on('bind:provider', function (namespace, singleton) {
        binding.namespace = namespace
        binding.singleton = singleton
      })
      Ioc.bind('App/Foo', function () {})
      expect(binding.namespace).to.equal('App/Foo')
      expect(binding.singleton).to.equal(false)
      Ioc.removeAllListeners('bind:provider')
    })

    it('should fire an event when a singleton is registered', function () {
      const binding = {}
      Ioc.on('bind:provider', function (namespace, singleton) {
        binding.namespace = namespace
        binding.singleton = singleton
      })
      Ioc.singleton('App/Foo', function () {})
      expect(binding.namespace).to.equal('App/Foo')
      expect(binding.singleton).to.equal(true)
      Ioc.removeAllListeners('bind:provider')
    })

    it('should be able to remove registered listeners', function () {
      const callback = function () { }
      Ioc.on('bind:provider', callback)
      expect(Ioc.listenerCount('bind:provider')).to.equal(1)
      Ioc.removeListener('bind:provider', callback)
      expect(Ioc.listenerCount('bind:provider')).to.equal(0)
    })

    it('should emit event when autoload directory is defined', function () {
      const autoload = {}
      Ioc.on('bind:autoload', function (namespace, toPath) {
        autoload.namespace = namespace
        autoload.path = toPath
      })
      Ioc.autoload('App', 'foo')
      expect(autoload.namespace).to.equal('App')
      expect(autoload.path).to.equal('foo')
      Ioc.removeAllListeners('bind:autoload')
    })

    it('should emit event when autoload directory is defined', function () {
      const autoload = {}
      Ioc.on('bind:autoload', function (namespace, toPath) {
        autoload.namespace = namespace
        autoload.path = toPath
      })
      Ioc.autoload('App', 'foo')
      expect(autoload.namespace).to.equal('App')
      expect(autoload.path).to.equal('foo')
      Ioc.removeAllListeners('bind:autoload')
    })

    it('should emit event when an alias is registered', function () {
      const aliasing = {}
      Ioc.on('bind:alias', function (alias, namespace) {
        aliasing.alias = alias
        aliasing.namespace = namespace
      })
      Ioc.alias('Event', 'Adonis/Src/Event')
      expect(aliasing.alias).to.equal('Event')
      expect(aliasing.namespace).to.equal('Adonis/Src/Event')
      Ioc.removeAllListeners('bind:alias')
    })

    it('should emit event when a provider is extend', function () {
      const binding = {}
      Ioc.on('extend:provider', function (key, namespace) {
        binding.key = key
        binding.namespace = namespace
      })
      Ioc.extend('Adonis/Src/Event', 'redis', function () {})
      expect(binding.key).to.equal('redis')
      expect(binding.namespace).to.equal('Adonis/Src/Event')
      Ioc.removeAllListeners('extend:provider')
    })

    it('should fire event when a provider is resolved', function () {
      const binding = {}
      Ioc.on('provider:resolved', function (namespace, value) {
        binding.namespace = namespace
        binding.value = value
      })
      Ioc.bind('Adonis/Src/Event', function () {
        return 'event'
      })
      Ioc.use('Adonis/Src/Event')
      expect(binding.value).to.equal('event')
      expect(binding.namespace).to.equal('Adonis/Src/Event')
      Ioc.removeAllListeners('provider:resolved')
    })

    it('should fire event when a singleton is resolved', function () {
      const binding = {}
      Ioc.on('provider:resolved', function (namespace, value) {
        binding.namespace = namespace
        binding.value = value
      })
      Ioc.singleton('Adonis/Src/Event', function () {
        return 'event'
      })
      Ioc.use('Adonis/Src/Event')
      expect(binding.value).to.equal('event')
      expect(binding.namespace).to.equal('Adonis/Src/Event')
      Ioc.removeAllListeners('provider:resolved')
    })

    it('should fire event when a singleton is resolved for multiple times', function () {
      const binding = []
      Ioc.on('provider:resolved', function (namespace, value) {
        binding.push({namespace, value})
      })
      Ioc.singleton('Adonis/Src/Event', function () {
        return 'event'
      })
      Ioc.use('Adonis/Src/Event')
      Ioc.use('Adonis/Src/Event')
      expect(binding).to.be.an('array')
      expect(binding[0].value).to.equal('event')
      expect(binding[1].value).to.equal('event')
      expect(binding[0].namespace).to.equal('Adonis/Src/Event')
      expect(binding[1].namespace).to.equal('Adonis/Src/Event')
      Ioc.removeAllListeners('provider:resolved')
    })

    it('should fire event when an autoloaded module is resolved', function () {
      const module = {}
      Ioc.autoload('App', path.join(__dirname, './app'))
      Ioc.on('module:resolved', function (namespace, namespacePath, value) {
        module.namespace = namespace
        module.namespacePath = namespacePath
        module.value = value
      })
      Ioc.use('App/Http/routes')
      expect(module.value).to.equal('routes')
      expect(module.namespace).to.equal('App/Http/routes')
      expect(module.namespacePath).to.equal(path.join(__dirname, './app/Http/routes'))
      Ioc.removeAllListeners('module:resolved')
    })

    it('should be able to add fake implementation for a binding', function () {
      Ioc.bind('Adonis/Src/Redis', function () {
        return 'redis'
      })
      Ioc.fake('Adonis/Src/Redis', function () {
        return 'fakeRedis'
      })
      const Redis = Ioc.use('Adonis/Src/Redis')
      expect(Redis).to.equal('fakeRedis')
    })

    it('should get ioc container instance on the faker callback', function () {
      Ioc.bind('Adonis/Src/Redis', function () {
        return 'redis'
      })
      Ioc.bind('Adonis/Src/Config', function () {
        return 'config'
      })
      Ioc.fake('Adonis/Src/Redis', function (app) {
        return app.use('Adonis/Src/Config')
      })
      const Redis = Ioc.use('Adonis/Src/Redis')
      expect(Redis).to.equal('config')
    })

    it('should return fake instance when alias is used', function () {
      Ioc.bind('Adonis/Src/Redis', function () {
        return 'redis'
      })
      Ioc.fake('Adonis/Src/Redis', function () {
        return 'fakeRedis'
      })
      Ioc.alias('Redis', 'Adonis/Src/Redis')
      const Redis = Ioc.use('Redis')
      expect(Redis).to.equal('fakeRedis')
    })

    it('should give priority to a fake when trying to use an autoloaded path', function () {
      Ioc.autoload('App', path.join(__dirname, './app'))
      Ioc.fake('App/Http/routes', function () {
        return 'fakeRoutes'
      })
      const routes = Ioc.use('App/Http/routes')
      expect(routes).to.equal('fakeRoutes')
    })

    it('should give priority to a fake when trying to make an autoloaded path', function () {
      Ioc.autoload('App', path.join(__dirname, './app'))
      Ioc.fake('App/Http/routes', function () {
        return 'fakeRoutes'
      })
      const routes = Ioc.make('App/Http/routes')
      expect(routes).to.equal('fakeRoutes')
    })

    it('should return fake implementation when trying to make a provider', function () {
      Ioc.bind('Adonis/Src/Redis', function () {
        return 'redis'
      })
      Ioc.fake('Adonis/Src/Redis', function () {
        return 'fakeRedis'
      })
      const Redis = Ioc.make('Adonis/Src/Redis')
      expect(Redis).to.equal('fakeRedis')
    })

    it('should throw an exception when fake does not pass a callback as 2nd param', function () {
      const fn = () => Ioc.fake('Adonis/Src/Redis', 'fake')
      expect(fn).to.throw(/Invalid arguments, fake expects a callback/)
    })
  })
})
