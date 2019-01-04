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
* [Working with bodyparser](#working-with-bodyparser)
  * [request.post()](#requestpost)
  * [request.all()](#requestall)
  * [request.input(key, defaultValue?)](#requestinputkey-defaultvalue)
  * [request.except(keys[])](#requestexceptkeys)
  * [request.only(keys[])](#requestonlykeys)
* [Updating request data](#updating-request-data)
  * [updateBody(body: object)](#updatebodybody-object)
  * [updateQs(data: object)](#updateqsdata-object)
  * [Why update request body or query string?](#why-update-request-body-or-query-string)
* [Typescript support](#typescript-support)
* [Extending via Macros](#extending-via-macros)
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

## Working with bodyparser
Body parser job is to read the request body (probably from a middleware) and then expose it somehow to the end user. This module offers a handful of methods to consume the bodyparser output and then share it via pre-built methods.

```js
http.createServer(function (req, res) {
  const request = new Request(req, res, {})

  const body = getRequestBodySomeHow(req)
  request.setInitialBody(body)

  console.log(request.all())
})
```

Along with `request.all()`, you can use all of the following methods.

#### request.post()
Get the request body as it is.

```js
request.post()
```

#### request.all()
Get merged copy of request body and query string.

```js
request.all()
```

#### request.input(key, defaultValue?)
Returns the value for a key from `request.all()`. The `defaultValue` is used when original value is `undefined` or `null`.

#### request.except(keys[])
Returns an object of values except the given keys.

```js
request.except(['submit', 'csrf'])
```

#### request.only(keys[])
Returns an object of values only for the given keys.

```js
request.only(['username', 'age'])
```

## Updating request data
Everything inside request is not subject to mutations, apart from the request `body` or `query string` object.

It is recommended to use inbuilt methods when trying to mutate these values, so that this module can keep a safe copy of original data.

#### updateBody(body: object)
Mutate the request body

```js
request.updateBody(newBodyObject)

// reflects new body
request.all()
```

#### updateQs(data: object)
Mutate query string object

```js
request.updateQs(data)

// reflects new query string
request.all()
request.get()
```

### Why update request body or query string?
Updating request body or query string is the first step you will perform to ensure the user data is consistent and clean before your app can consume it.

Now after the mutation, you do want to keep the copy of original data, so that if their are any errors, you can reflect the original data copy to the end user.

For example: 

1. The form accepts amount of an item in **Euros(€)**.
2. Your server converts it to **cents** before validating the form values.
3. If their are any errors during the validation, you want the form to show the amount back in **Euros(€)** and not **cents**.

```ts
http.createServer(function (req, res) {
  const request = new Request(req, res, {})

  /**
   * Step 1: Original request body submitted by
   * the user.
   */
  const body = getRequestBodySomeHow(req)
  request.setInitialBody(body)

  /**
   * Step 2: Sanitize data
   */
  const body = request.all()
  body.amount = toCents(body.amount)
  request.updateBody(body)

  /**
   * Step 3: Validate data
   */
  validate(request.all())

  /**
   * Step 4: Assuming validation failed and reflect
   * original data back in form
   */
  res.send({
    original: request.original()
  })
})
```

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
