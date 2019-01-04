![](https://res.cloudinary.com/adonisjs/image/upload/q_100/v1546601487/node-req_z5tirr.png)

<div align="center">
    <strong>Facade over <a href="https://nodejs.org/api/http.html#http_class_http_incomingmessage">req</a> object to consistently read request values.</strong>
</div>

<br />

<div align="center">
  <!-- NPM version -->
  <a href="https://npmjs.org/package/node-req">
    <img src="https://img.shields.io/npm/v/node-req.svg?style=flat-square"
      alt="NPM version" />
  </a>
  <!-- Build Status -->
  <a href="https://travis-ci.org/poppinss/node-req">
    <img src="https://img.shields.io/travis/poppinss/node-req/master.svg?style=flat-square"
      alt="Build Status" />
  </a>
  <!-- Test Coverage -->
  <a href="https://coveralls.io/github/poppinss/node-req">
    <img src="https://img.shields.io/coveralls/github/poppinss/node-req/master.svg?style=flat-square"
      alt="Test Coverage" />
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/node-req">
    <img src="https://img.shields.io/npm/dt/node-req.svg?style=flat-square"
      alt="Download" />
  </a>
</div>

<br />
<br />

Node req is a facade to be **used by any framework** to read the request values. The [req](https://nodejs.org/api/http.html#http_class_http_incomingmessage) object of Node.js HTTP request is very bare bones and it can get cumbersome to consistently read information for a given request.

## Table of Contents
* [Features](#features)
* [Getting started](#getting-started)
* [Difference from other frameworks](#difference-from-other-frameworks)
* [API](#api)

## Features
- **Handles inconsistencies** between different header names like `referer` and `referrer`.
- **Proxy headers support** from reverse proxies like `nginx` or `apache`. 
- **Content negotiation** using `Accept` headers.
- **Form method spoofing support**.
- **Helper methods**.
- **Typings support**
- **Extendable from outside**
- **Thoroughly tested**.

## Getting started
Install the package from npm as follows:

```sh
npm i node-req

# yarn
yarn add node-req
```

and then use it by importing it as follows:

```js
const { Request } = require('node-req')
const http = require('http')

http.createServer(function (req, res) {
  const request = new Request(req, res, {})
  res.end(`Url without query string is ${request.url()}`)
})
```

The `url` property on Node.js core `req` object returns the URL with query string and in order to drop query string, you will have to parse the URL manually.

Whereas, with `node-req`, the `request.url()` method supports both by passing a parameter to include the query string.

## Typescript support
The module is written in Typescript, so expect intellisense to work out of the box. Also an interface is exported, which you can extend if extending the original `Request` class.

```ts
import { IRequest: BaseIRequest } from 'node-req/build/src/IRequest'

export interface IRequest extends BaseIRequest {
  myCustomMethod (): string
}
```

and then use it as follows

```ts
import { IRequest } from './my/interfaces'

http.createServer(function (req, res) {
  const request: IRequest = new Request(req, res, {})
  request.myCustomMethod() // intellisense works
})
```

## Extending via Macros
The module extends [macroable](https://github.com/poppinss/macroable), which allows extending classes from outside in. You can use the following methods to extend the prototype of the `Request` class.

```js
import { Request } from 'node-req'

// Added as a method
Request.macro('getTime', function () {
  return new Date().getTime()
})

// Added as property
Request.getter('getTime', function () {
  return new Date().getTime()
})

// Added as singleton property
Request.getter('getTime', function () {
  return new Date().getTime()
}, true)
```

Later, using the request instance, you can use `getters` and `macros`.

```js
http.createServer(function (req, res) {
  const request = new Request(req, res, {})

  request.getTime // getter
  request.getTime() // macro
})
```

## Difference from other frameworks
**You don't need it if you are using Express or Koa**, since their `req` object is already decorated with handful of convivent getters.

In case you are building a framework or using a framework like [micro](https://github.com/zeit/micro), then this module can save lots of time.

## API
The API docs are generated using Typedoc and can be found [here](https://node-req.netlify.com/classes/_request_.request.html).
