'use strict'

const test = require('japa')
const path = require('path')
const Ioc = require('../../src/Ioc')
const Resolver = require('../../src/Resolver')
const ResolverManager = require('../../src/Resolver/Manager')

test.group('Resolver', (group) => {
  group.beforeEach(() => {
    this.ioc = new Ioc()
  })

  test('throw exception when directories are not defined', (assert) => {
    const resolver = () => new Resolver()
    assert.throw(resolver, 'Cannot initiate resolver without registering directories')
  })

  test('throw exception when namespace is not defined', (assert) => {
    const directories = {
      views: 'Views'
    }
    const resolver = () => new Resolver(this.ioc, directories)
    assert.throw(resolver, 'Cannot initiate resolver without registering appNamespace')
  })

  test('register directories hash', (assert) => {
    const directories = {
      views: 'Views'
    }
    const resolver = new Resolver(this.ioc, directories, 'App')
    assert.deepEqual(resolver._directories, directories)
  })

  test('register app namespace', (assert) => {
    const resolver = new Resolver(this.ioc, {}, 'App')
    assert.deepEqual(resolver._appNamespace, 'App')
  })

  test('make path to a provider', (assert) => {
    const resolver = new Resolver(this.ioc, {}, 'App')
    assert.equal(resolver.translate('Adonis/Src/Server'), 'Adonis/Src/Server')
  })

  test('make path to app namespace', (assert) => {
    const resolver = new Resolver(this.ioc, {}, 'App')
    assert.equal(resolver.translate('App/Controllers/FooController'), 'App/Controllers/FooController')
  })

  test('make path for pre-registered directory', (assert) => {
    const resolver = new Resolver(this.ioc, {
      httpControllers: 'Controllers'
    }, 'App', 'httpControllers')
    assert.equal(resolver.translate('FooController'), 'App/Controllers/FooController')
  })

  test('return untouched namespace when starts with autoload namespace', (assert) => {
    const resolver = new Resolver(this.ioc, {
      httpControllers: 'Controllers'
    }, 'App', 'httpControllers')
    assert.equal(resolver.translate('App/Controllers/FooController'), 'App/Controllers/FooController')
  })

  test('throw exception when directory is not pre-registered', (assert) => {
    const resolver = new Resolver(this.ioc, {
      httpControllers: 'Controllers'
    }, 'App', 'wsControllers')

    const fn = () => resolver.translate('FooController')
    assert.throw(fn, 'Cannot translate binding, since wsControllers is not registered under directories')
  })

  test('make sure path is normalized', (assert) => {
    const resolver = new Resolver(this.ioc, {
      httpControllers: 'Controllers'
    }, 'App', 'httpControllers')
    assert.equal(resolver.translate('/FooController'), 'App/Controllers/FooController')
  })

  test('remove ending /', (assert) => {
    const resolver = new Resolver(this.ioc, {
      httpControllers: 'Controllers'
    }, 'App', 'httpControllers')
    assert.equal(resolver.translate('FooController/'), 'App/Controllers/FooController')
  })

  test('remove starting /', (assert) => {
    const resolver = new Resolver(this.ioc, {
      httpControllers: 'Controllers'
    }, 'App', 'httpControllers')
    assert.equal(resolver.translate('/App/Controllers/FooController'), 'App/Controllers/FooController')
  })

  test('identify complete namespace and return as it is', (assert) => {
    const resolver = new Resolver(this.ioc, { httpControllers: 'Controllers' }, 'App', 'httpControllers')
    assert.equal(resolver.translate('App/Controllers/FooController'), 'App/Controllers/FooController')
    assert.equal(resolver.translate('App/Controllers/FooController/App/Controllers'), 'App/Controllers/FooController/App/Controllers')
  })

  test('identify complete namespace but for a different directory', (assert) => {
    const resolver = new Resolver(this.ioc, { httpControllers: 'Controllers' }, 'App', 'httpControllers')
    assert.equal(resolver.translate('App/Models/Foo'), 'App/Models/Foo')
  })

  test('force binding to be proivder', (assert) => {
    const resolver = new Resolver(this.ioc, { httpControllers: 'Controllers' }, 'App', 'httpControllers')
    assert.equal(resolver.translate('@provider:Adonis/FooController'), 'Adonis/FooController')
  })

  test('resolve binding when input is a function', (assert) => {
    const resolver = new Resolver(this.ioc, { httpControllers: 'Controllers' }, 'App')
    const fn = function () {}
    assert.deepEqual(resolver.resolveFunc(fn), {instance: null, isClosure: true, method: fn})
  })

  test('resolve binding via IoC container', (assert) => {
    const resolver = new Resolver(this.ioc, { httpControllers: 'Controllers' }, 'App')
    class FooClass {}
    const fooInstance = new FooClass()
    this.ioc.bind('Adonis/Src/Foo', function () {
      return fooInstance
    })
    assert.deepEqual(resolver.resolve('Adonis/Src/Foo'), fooInstance)
  })

  test('resolve binding with method expression via IoC container', (assert) => {
    const resolver = new Resolver(this.ioc, { httpControllers: 'Controllers' }, 'App')
    class FooClass {
      bar () {}
    }
    const fooInstance = new FooClass()
    this.ioc.bind('Adonis/Src/Foo', function () {
      return fooInstance
    })
    const resolvedValue = resolver.resolveFunc('Adonis/Src/Foo.bar')
    assert.isFunction(resolvedValue.method)
    delete resolvedValue.method
    assert.deepEqual(resolvedValue, { instance: fooInstance, isClosure: false })
  })

  test('throw exception when method does not exists', (assert) => {
    const resolver = new Resolver(this.ioc, { httpControllers: 'Controllers' }, 'App')
    class FooClass {
    }
    const fooInstance = new FooClass()
    this.ioc.bind('Adonis/Src/Foo', function () {
      return fooInstance
    })
    const fn = () => resolver.resolveFunc('Adonis/Src/Foo')
    assert.throw(fn, 'E_INVALID_MAKE_STRING: Ioc.makeFunc expects a string in module.method format instead received Adonis/Src/Foo')
  })

  test('throw exception when invalid binding format', (assert) => {
    const resolver = new Resolver(this.ioc, { httpControllers: 'Controllers' }, 'App')
    class FooClass {
    }
    const fooInstance = new FooClass()
    this.ioc.bind('Adonis/Src/Foo', function () {
      return fooInstance
    })
    const fn = () => resolver.resolveFunc('Adonis/Src/Foo.bar.baz')
    assert.throw(fn, 'E_INVALID_MAKE_STRING: Ioc.makeFunc expects a string in module.method format instead received Adonis/Src/Foo.bar.baz')
  })

  test('skip dots by escaping them', (assert) => {
    const resolver = new Resolver(this.ioc, { httpControllers: 'Controllers' }, 'App')
    class FooClass {
      bar () {}
    }
    const fooInstance = new FooClass()
    this.ioc.bind('Adonis/Src.Foo', function () {
      return fooInstance
    })
    const resolvedValue = resolver.resolveFunc('Adonis/Src\\.Foo.bar')
    assert.isFunction(resolvedValue.method)
    delete resolvedValue.method
    assert.deepEqual(resolvedValue, {instance: fooInstance, isClosure: false})
  })

  test('throw exception when binding is not a string, neither a callback', (assert) => {
    const resolver = new Resolver(this.ioc, { httpControllers: 'Controllers' }, 'App')
    const fn = () => resolver.resolveFunc({})
    assert.throw(fn, 'E_INVALID_PARAMETER: Resolver.translate expects binding to be a valid string instead received object')
  })
})

test.group('Resolver Manager', () => {
  test('normalize binding', (assert) => {
    const resolverManager = new ResolverManager(this.ioc)

    resolverManager.appNamespace('App')
    assert.equal(resolverManager.translate('Adonis//Src/Foo'), 'Adonis/Src/Foo')
  })

  test('make binding for a given directory', (assert) => {
    const resolverManager = new ResolverManager(this.ioc)

    resolverManager.directories({ httpControllers: 'Controllers' })
    resolverManager.appNamespace('App')
    assert.equal(resolverManager.forDir('httpControllers').translate('User'), 'App/Controllers/User')
  })

  test('resolve binding', (assert) => {
    const resolverManager = new ResolverManager(this.ioc)
    this.ioc.autoload(path.join(__dirname, './app'), 'App')

    resolverManager.directories({ adminDir: 'Admin' })
    resolverManager.appNamespace('App')

    assert.equal(resolverManager.forDir('adminDir').resolve('User').constructor.name, 'AdminUser')
  })

  test('resolve binding and function', (assert) => {
    const resolverManager = new ResolverManager(this.ioc)
    this.ioc.autoload(path.join(__dirname, './app'), 'App')

    resolverManager.directories({ adminDir: 'Admin' })
    resolverManager.appNamespace('App')
    const output = resolverManager.forDir('adminDir').resolveFunc('User.get')

    assert.equal(output.isClosure, false)
    assert.equal(output.instance.constructor.name, 'AdminUser')
    assert.isFunction(output.method)
  })

  test('resolve provider', (assert) => {
    const resolverManager = new ResolverManager(this.ioc)
    this.ioc.bind('User', () => {
      return new (require('./app/User'))()
    })

    resolverManager.appNamespace('App')
    assert.equal(resolverManager.resolve('User').constructor.name, 'User')
  })

  test('resolve function on provider', (assert) => {
    const resolverManager = new ResolverManager(this.ioc)
    this.ioc.bind('User', () => {
      return new (require('./app/User'))()
    })

    resolverManager.appNamespace('App')
    const output = resolverManager.resolveFunc('User.get')

    assert.equal(output.isClosure, false)
    assert.equal(output.instance.constructor.name, 'User')
    assert.isFunction(output.method)
  })
})
