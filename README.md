# AdonisJs Fold 🚀
> Dependency manager and IoC container for Node.js

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]
[![Appveyor][appveyor-image]][appveyor-url]

Fold is a dependency manager for Node.js used by AdonisJs framework. Below is the list of features.

<img src="http://res.cloudinary.com/adonisjs/image/upload/q_100/v1497112678/adonis-purple_pzkmzt.svg" width="200px" align="right" hspace="30px" vspace="140px">

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

[appveyor-image]: https://ci.appveyor.com/api/projects/status/github/poppinss/adonis-fold?branch=dawn&svg=true&passingText=Passing%20On%20Windows
[appveyor-url]: https://ci.appveyor.com/project/thetutlage/adonis-fold

[npm-image]: https://img.shields.io/npm/v/adonis-fold.svg?style=flat-square
[npm-url]: https://npmjs.org/package/adonis-fold

[travis-image]: https://img.shields.io/travis/poppinss/adonis-fold/dawn.svg?style=flat-square
[travis-url]: https://travis-ci.org/poppinss/adonis-fold

[gitter-url]: https://gitter.im/adonisjs/adonis-framework
[gitter-image]: https://img.shields.io/badge/gitter-join%20us-1DCE73.svg?style=flat-square

[trello-url]: https://trello.com/b/yzpqCgdl/adonis-for-humans
[trello-image]: https://img.shields.io/badge/trello-roadmap-89609E.svg?style=flat-square

[patreon-url]: https://www.patreon.com/adonisframework
[patreon-image]: https://img.shields.io/badge/patreon-support%20AdonisJs-brightgreen.svg?style=flat-square

[npm-downloads]: https://img.shields.io/npm/dm/adonis-fold.svg?style=flat-square
