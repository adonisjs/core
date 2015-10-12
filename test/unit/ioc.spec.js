'use strict'

/**
 * adonis-fold
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Ioc    = require('../../src/Ioc')
const chai   = require('chai')
const expect = chai.expect
const path   = require('path')

describe('Ioc', function () {

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
        return Ioc.bind('App/Foo','bar')
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

    it('should add manager with a namespace and it\'s defination', function () {
      class Foo{
        static extend () {

        }
      }
      Ioc.manager('App/Foo',Foo)
      expect(Ioc.getManagers()['App/Foo']).deep.equal(Foo)
    })

    it('should throw an error when manager does not have extend method', function () {
      class Foo{}
      const fn = function () {
        return Ioc.manager('App/Foo',Foo)
      }
      expect(fn).to.throw(/Incomplete implementation/g)
    })

    it('should be able to fetch binding from ioc container using use method', function () {
      class Foo{}
      Ioc.bind('App/Foo',function () {
        return Foo
      })
      expect(Ioc.use('App/Foo')).deep.equal(Foo)
    })

    it('should be able to fetch binding from ioc container with type hinted depedencies', function () {

      class Foo{
        constructor (App_Bar) {
          this.bar = App_Bar
        }
      }
      class Bar{}

      Ioc.bind('App/Bar',function () {
        return new Bar
      })

      Ioc.bind('App/Foo',function (app) {
        return new Foo(app.use('App/Bar'))
      })

      const foo = Ioc.use('App/Foo')
      expect(foo.bar instanceof Bar).to.equal(true)
    })

    it('should be able to bind instances as singleton', function (done) {

      class Foo {
        constructor(){
          this.time = new Date().getTime()
        }
      }
      Ioc.singleton('App/Foo', function () {
        return new Foo
      })

      const foo1 = Ioc.use('App/Foo')
      setTimeout(function () {
        const foo2 = Ioc.use('App/Foo')
        expect(foo1.time).to.equal(foo2.time)
        done()
      },1000)

    })

  })

  context('Autoloading', function () {
    it('should to be able to autoload directory under a given namespace', function () {
      const namespace = 'App'
      const directory = path.join(__dirname,'./app')
      Ioc.autoload(namespace, directory)
      expect(Ioc.use('App/Http/routes')).to.equal('routes')
    })

    it('should to throw an error when unable to require file', function () {
      const namespace = 'App'
      const directory = path.join(__dirname,'./app')
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
        static extend (){
        }
      }

      class Mongo {
        constructor(){
          this.name = 'mongo'
        }
      }
      Ioc.manager('App/Foo',Foo)

      Ioc.extend('App/Foo', 'mongo', function () {
        return new Mongo()
      })

      expect(Ioc.getExtenders()['App/Foo'][0]).to.be.an('object')
      expect(Ioc.getExtenders()['App/Foo'][0].key).to.equal('mongo')

    })

    it('should extend provider before resolving it', function () {

      class Cache{

        static drivers() {}

        constructor () {
          return this.constructor.drivers['redis']
        }

        static extend(key, defination) {
          this.drivers[key] = defination
        }
      }

      class Redis{}

      Ioc.manager('App/Cache', Cache)

      Ioc.bind('App/Cache', function () {
        return new Cache
      })

      Ioc.extend('App/Cache', 'redis', function () {
        return new Redis
      })

      expect(Ioc.use('App/Cache') instanceof Redis).to.equal(true)

    })

    it('should throw an error when trying to extend provider without a callback', function () {
      const fn = function () {
        return Ioc.extend('App/Cache','redis','Redis')
      }
      expect(fn).to.throw(/Invalid arguments, extend expects a callback/)
    })

  })

  context('Make', function () {

    it('should make an instance of class when there are no injections', function () {

      class Redis{
      }

      const redis = Ioc.make(Redis)
      expect(redis instanceof Redis).to.equal(true)

    })

    it('should make an instance of class when there are injections to be typhinted from constructor', function () {

      class Foo {}

      Ioc.bind('App/Foo', function () {
        return new Foo
      })

      class Redis{

        constructor (App_Foo) {
          this.foo = App_Foo
        }

      }

      const redis = Ioc.make(Redis)
      expect(redis.foo instanceof Foo).to.equal(true)

    })

    it('should make an instance of class when there are injections injected via inject method', function () {

      class Foo {}

      Ioc.bind('App/Foo', function () {
        return new Foo
      })

      class Redis{

        static get inject() {
          return ["App/Foo"]
        }

        constructor (Foo) {
          this.foo = Foo
        }

      }

      const redis = Ioc.make(Redis)
      expect(redis.foo instanceof Foo).to.equal(true)

    })

    it('should throw an error , when trying to make something other than a class', function () {

      const fn = function () {
        return Ioc.make({})
      }

      expect(fn).to.throw(/Invalid type/)

    })

    it('should resolve and return class intance with required method', function () {

      class Foo {

        bar () {
          return 'bar'
        }

      }

      Ioc.bind('App/Foo', function (){
        return Foo
      })

      const foo = Ioc.makeFunc('App/Foo.bar')
      expect(foo.instance instanceof Foo).to.equal(true)
      expect(foo.instance[foo.method]()).to.equal('bar')

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

      class Baz {}

      Ioc.bind('App/Baz', function () {
        return Baz
      })

      const fn = function () {
        return Ioc.makeFunc('App/Baz.bar')
      }

      expect(fn).to.throw(/bar does not exists/)

    })


  })

  context('Global', function () {

    it('should throw an error, when unable to resolve depedency from ioc container', function () {

      const fn = function () {
        return Ioc.use('Bar')
      }
      expect(fn).to.throw(/Unable to resolve Bar/)
    })


    it('should be able to alias any binding inside ioc container', function () {
      class Foo {}
      Ioc.bind('App/Foo', function () {
        return new Foo
      })
      Ioc.alias('Foo','App/Foo')
      expect(Ioc.use('Foo') instanceof Foo).to.equal(true)
    })

  })

})
