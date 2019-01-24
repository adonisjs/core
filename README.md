# AdonisJs Fold 🚀
> Dependency manager and IoC container for Node.js

[![travis-image]][travis-url]
[![appveyor-image]][appveyor-url]
[![coveralls-image]][coveralls-url]
[![npm-image]][npm-url]
![](https://img.shields.io/badge/Uses-Typescript-294E80.svg?style=flat-square&colorA=ddd)

Adonis fold is zero dependency library to enable Dependency Injection in your apps using an IoC container.

The library itself is pretty lean. However, offers handful of tools to make DI easier and simpler.

- Zero depedencies.
- Support for fakes to ease testing.
- Gazallion times faster than Node.js require.

> Using IoC container for simple apps can become overkill. Use it when you are creating an eco-system of plugins and wants them to play together gracefully using a global dependency store.

## Getting started
The first step it to install the package from npm as follows.

```sh
npm i @adonisjs/fold

# Using Yarn
yarn add @adonisjs/fold
```

Next, is to use package by importing the container.

```js
const { Ioc } = require('@adonisjs/fold')
const ioc = new Ioc()

ioc.bind('unique/namespace', () => {
  return 'value'
})
```

The `bind` receives 2 arguments.

1. The `namespace` is the unique name for the binding.
2. The factory function is executed everytime the dependency is fetched from the container and return value is used.

If you want the factory functions to be executed only once, then make use of the `singleton` instead of `bind`.

```js
ioc.singleton('unique/namespace', () => {
  return 'value'
})
```

## What is Dependency Injection?
Dependency Injection is a simple concept of injecting dependencies during the creation of an object vs being dependent on them globally.

In the following example we `require` the database service and mailer to perform user registeration. 

```js
const db = require('./db')
const mailer = require('./mailer')

class UserService {
  async register (userData) {
    await db.create(userData)
    await mailer.sendEmail('email-template', userData.email)
  }
}
```

Now, if you want to test the above `UserService`, there is no simply way to use a different implementation of `mailer` or `db`.

Let's refactor the above code and accept the dependencies as constructor arguments.

```js
class UserService {
  constructor (db, mailer) {
    this.db = db
    this.mailer = mailer
  }

  async register (userData) {
    await this.db.create(userData)
    this.mailer.sendEmail('email-template', userData.email)
  }
}
```

With the refactored code, testing `UserService` is simple, since you can inject alternate implementations of `db` and `mailer` during testing.

## What is IoC container?
If classes makes use of Dependency Injection, there has to be someone to inject these dependencies in the right order.

Imagine, before using the internal modules of a framework like AdonisJs, you have to manually build classes by injecting dependencies to them.

```js
const Mail = require('@adonisjs/mail')
const { Config, View } = require('@adonisjs/framework')

const config = new Config(__dirname)
const view = new View(config)
const mailer = new Mail(config, view)

mailer.send()
```

The above code will quickly spin out of your hands for many reasons.

1. It will take lots of brain power to decide, where and when to construct these classes.
2. If an internal module like `@adonisjs/mail` changes the order of arguments, then the package has to be released as a breaking change.
3. Finally, as an application developer, why should you even care about building these objects from hand.

## Using IoC container
Now that we understand Dependency Injection and the need of container, let's see how to use the container in an application.

Frameworks like AdonisJs uses this module to build an entire eco-system of modules. All the framework modules are registered to the container and your application pulls them from container only.

This approach has several benefits

1. The user of the framework, won't have to manually construct classes. The creator of the module constructs them and binds them to the container.
2. All dependencies inside the container can use each other, without requiring them in a hard coded way. The concept is generally known as loose coupling.
3. Makes the testing easier, since faking the value of a namespace inside a container is simpler than proxying `require` calls.

```js
const { Ioc } = require('@adonisjs/fold')
const container = new Ioc()

container.bind('Config', function () {
  return {
    appKey: process.env.APP_KEY,
    database: {
      // config
    },
    redis: {
      // config
    }
  }
})

module.exports = { container }
```

Now anywhere inside your application, you can fetch the config from the container using it's namespace.

```js
const { container } = require('./app')
container.use('Config') // returns object
```

Building an eco-system of plugins on top of this approach enables loose coupling and better development experience.

### Concrete classes with DI

```js
class Config {
  constructor (configObject) {
  }

  get (key) {
    // return value of a key inside the config object
  }
}

class Redis {
  constructor (config) {
  }
}

class Cache {
  constructor (config, redis) {
  }
}
```

### Binding them to the container

```js
container.bind('App/Config', function () {
  return new Config({
    redis: {
      // config
    },
    cache: {
      // config
    }
  })
})

container.bind('App/Redis', function () {
  return new Redis(container.use('App/Config'))
})

container.bind('App/Cache', function () {
  return new Cache(container.use('App/Redis'), container.use('App/Config'))
})
```

Now anywhere inside your application, you can use the `Cache` object without worrying about how to build it.

```js
const cache = container.use('App/Cache')
```

## Usage with Typescript

## Change log
The change log can be found in the [CHANGELOG.md](CHANGELOG.md) file.

## Contributing
Everyone is welcome to contribute. Please go through the following guides, before getting started.

1. [Contributing](https://adonisjs.com/contributing)
2. [Code of conduct](https://adonisjs.com/code-of-conduct)

## Authors & License
[Harminder Virk](https://github.com/Harminder Virk) and [contributors](https://github.com/poppinss/adonis-fold/graphs/contributors).

MIT License, see the included [MIT](LICENSE.md) file.

[travis-image]: https://img.shields.io/travis/poppinss/adonis-fold/master.svg?style=flat-square&logo=travis
[travis-url]: https://travis-ci.org/poppinss/adonis-fold "travis"

[appveyor-image]: https://img.shields.io/appveyor/ci/thetutlage/adonis-fold/master.svg?style=flat-square&logo=appveyor
[appveyor-url]: https://ci.appveyor.com/project/thetutlage/adonis-fold "appveyor"

[coveralls-image]: https://img.shields.io/coveralls/poppinss/adonis-fold/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/poppinss/adonis-fold "coveralls"

[npm-image]: https://img.shields.io/npm/v/@adonisjs/fold.svg?style=flat-square&logo=npm
[npm-url]: https://npmjs.org/package/@adonisjs/fold "npm"
