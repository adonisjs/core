# AdonisJs Fold
> Dependency manager and IoC container for Node.js :rocket:

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]

![](https://s3-us-west-1.amazonaws.com/patreon.user/s6hrkQF2thEpkT1A3vigzCONJuVtaUzHpIyT3KaHbvENxseNcETlvOuVUO5ZzVHl_large_2.png)

[![Gitter Channel][gitter-image]][gitter-url]
[![Trello][trello-image]][trello-url]
[![Patreon][patreon-image]][patreon-url]

Fold is a dependency manager for Node.js used by AdonisJs framework. Below is the list of features.

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
const fold = require('adonis-fold')
const Ioc = fold.Ioc

class Foo {
}

Ioc.bind('App/Foo', function () {
  return new Foo()
})

const foo = Ioc.use('App/Foo')
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

Ioc.bind('App/Foo', function (app) {
  const config = app.use('App/Config')
  return new Foo(config)
})

const foo = Ioc.use('App/Foo')
```

This time, we injected `App/Config` behind the scenes and the consumer of the `Foo` class won't have to worry about passing the config manually.

## Moving Forward
Checkout the [official documentation](http://adonisjs.com/docs/ioc-container) at the AdonisJs website for more info.

## Tests
Tests are written using `mocha` and `chaijs`. Run the following commands to run tests.

```bash
npm run test
npm run test -- --coverage
npm run test -- --lcov
```

1. `--coverage` will output the coverage to the `coverage` directory.

2. `--lcov` will output the coverage to Coveralls.

## Release History

Checkout [CHANGELOG.md](CHANGELOG.md) file for release history.

## Meta

AdonisJs – [@adonisframework](https://twitter.com/adonisframework) – virk@adonisjs.com

Checkout [LICENSE.txt](LICENSE.txt) for license information

Harminder Virk (Aman) - [https://github.com/thetutlage](https://github.com/thetutlage)


[npm-image]: https://img.shields.io/npm/v/adonis-fold.svg?style=flat-square

[npm-url]: https://npmjs.org/package/adonis-fold

[npm-downloads]: https://img.shields.io/npm/dm/adonis-fold.svg?style=flat-square

[travis-image]: https://img.shields.io/travis/poppinss/adonis-fold/master.svg?style=flat-square

[travis-url]: https://travis-ci.org/poppinss/adonis-fold

[gitter-url]: https://gitter.im/adonisjs/adonis-framework
[gitter-image]: https://img.shields.io/badge/gitter-join%20us-1DCE73.svg?style=flat-square

[trello-url]: https://trello.com/b/yzpqCgdl/adonis-for-humans
[trello-image]: https://img.shields.io/badge/trello-roadmap-89609E.svg?style=flat-square

[patreon-url]: https://www.patreon.com/adonisframework
[patreon-image]: https://img.shields.io/badge/patreon-support%20AdonisJs-brightgreen.svg?style=flat-square
