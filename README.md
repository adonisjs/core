# AdonisJs Fold 🚀
> Dependency manager and IoC container for Node.js

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Appveyor][appveyor-image]][appveyor-url]
[![Coveralls][coveralls-image]][coveralls-url]

Fold is a dependency manager for Node.js used by AdonisJs framework. Below is the list of features.

<img src="http://res.cloudinary.com/adonisjs/image/upload/q_100/v1497112678/adonis-purple_pzkmzt.svg" width="200px" align="right" hspace="30px" vspace="100px">

## Features

1. Support for binding dependencies with unique namespaces.
2. Autoloading multiple directories under a namespace.
3. Defining aliases for bindings.
4. Automatic resolution of namespaces and transparent dependency injection.
5. Support for `fakes` when writing tests.
6. Support for service providers, to bind dependencies in structured way.


## Installation
You can install the package from npm.
```bash
npm i --save adonis-fold
```

## Basic Usage

```js
const { ioc } = require('adonis-fold')

class Foo {
}

ioc.bind('App/Foo', function () {
  return new Foo()
})

const foo = ioc.use('App/Foo')
// return Foo class instance

ioc.with('App/Foo', (Foo) => {
  // Only if App/Foo exists
})
```

Simple enough! But we do not see the real power of the Ioc container, since we can instantiate the class manually too. Right? NO

Here are the following benefits.

1. The author of the `Foo` class can decide how to instantiate the class and return a properly configured instance, instead of leaving it to the consumer.

2. While you are making use of the Ioc container, one binding can be dependent upon others, without much work. For example

```js

class Foo {
  constructor (config) {
    //
  }
}

ioc.bind('App/Foo', function (app) {
  const config = app.use('App/Config')
  return new Foo(config)
})

const foo = ioc.use('App/Foo')
```

This time, we injected `App/Config` behind the scenes and the consumer of the `Foo` class won't have to worry about passing the config manually.

## Moving Forward
Checkout the [official documentation](http://adonisjs.com/docs/ioc-container) at the AdonisJs website for more info.

## Tests
Tests are written using [japa](http://github.com/thetutlage/japa). Run the following commands to run tests.

```bash
npm run test:local

# report coverage
npm run test

# on windows
npm run test:win
```

## Release History

Checkout [CHANGELOG.md](CHANGELOG.md) file for release history.

## Meta

AdonisJs – [@adonisframework](https://twitter.com/adonisframework) – virk@adonisjs.com

Checkout [LICENSE.txt](LICENSE.txt) for license information

Harminder Virk (Aman) - [https://github.com/thetutlage](https://github.com/thetutlage)

[appveyor-image]: https://img.shields.io/appveyor/ci/thetutlage/adonis-fold/master.svg?style=flat-square

[appveyor-url]: https://ci.appveyor.com/project/thetutlage/adonis-fold

[npm-image]: https://img.shields.io/npm/v/@adonisjs/fold.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@adonisjs/fold

[travis-image]: https://img.shields.io/travis/poppinss/adonis-fold/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/poppinss/adonis-fold

[coveralls-image]: https://img.shields.io/coveralls/poppinss/adonis-fold/develop.svg?style=flat-square

[coveralls-url]: https://coveralls.io/github/poppinss/adonis-fold
