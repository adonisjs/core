# AdonisJs Router
> Advanced and full featured HTTP router for Node.js

[![travis-image]][travis-url]
[![appveyor-image]][appveyor-url]
[![coveralls-image]][coveralls-url]
[![npm-image]][npm-url]
![](https://img.shields.io/badge/Uses-Typescript-294E80.svg?style=flat-square&colorA=ddd)

This package is extracted from [AdonisJs framework](https://adonisjs.com/) to work as a standalone module for adding routing layer to any Node.js HTTP server.

The goal of this package is to offer a rich API for declaring routes, quite similar to Laravel and Ruby of rails. Even after exposing a rich API, the router is faster than implementation of Express.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of contents

- [Features](#features)
- [Getting started](#getting-started)
- [Change log](#change-log)
- [Contributing](#contributing)
- [Authors & License](#authors--license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features
- Define routes across multiple domains
- Support for resourceful routes (based on rails conventions)
- Optionally group routes with similar functionality
- Regex based params validation
- Written in Typescript for better autocomplete support.
- Extremely fast with the help of [matchit](https://github.com/lukeed/matchit)

## Getting started
Let's start by installing the package from npm.

```sh
npm i @adonisjs/router
```

and then import it as follows.

```ts
import { Router } from '@adonisjs/router'
import { createServer } from 'http'

const router = new Router()

router.get('/', function (req, res) {
  res.end(req.url)
})

// this is import
router.commit()

createServer((req, res) => {
  const route = router.find(req.url, req.method)

  if (route) {
    route.handler(req, res)
  } else {
    res.writeHead(404)
    res.end('Route not found')
  }
}).listen(3000)
```

The basic API of the `router` is similar to expressjs. However, there are far more possibilities than defining simple routes.


## Change log

The change log can be found in the [CHANGELOG.md](CHANGELOG.md) file.

## Contributing

Everyone is welcome to contribute. Please go through the following guides, before getting started.

1. [Contributing](https://adonisjs.com/contributing)
2. [Code of conduct](https://adonisjs.com/code-of-conduct)


## Authors & License
[thetutlage](https://github.com/thetutlage) and [contributors](https://github.com/null/null/graphs/contributors).

MIT License, see the included [MIT](LICENSE.md) file.

[travis-image]: https://img.shields.io/travis/null/null/master.svg?style=flat-square&logo=travis
[travis-url]: https://travis-ci.org/null/null "travis"

[appveyor-image]: https://img.shields.io/appveyor/ci/thetutlage/null/master.svg?style=flat-square&logo=appveyor
[appveyor-url]: https://ci.appveyor.com/project/thetutlage/null "appveyor"

[coveralls-image]: https://img.shields.io/coveralls/null/null/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/null/null "coveralls"

[npm-image]: https://img.shields.io/npm/v/router.svg?style=flat-square&logo=npm
[npm-url]: https://npmjs.org/package/router "npm"
