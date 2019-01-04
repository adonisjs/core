<h1 align="center">Node Req</h1>
<div align="center">
    <strong>Facade over <a href="https://nodejs.org/api/http.html#http_class_http_incomingmessage">req</a> object to consistently read request values.</strong>
</div>

<br />

<div align="center">
  <!-- Stability -->
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square"
      alt="API stability" />
  </a>
  <!-- NPM version -->
  <a href="https://npmjs.org/package/choo">
    <img src="https://img.shields.io/npm/v/choo.svg?style=flat-square"
      alt="NPM version" />
  </a>
  <!-- Build Status -->
  <a href="https://travis-ci.org/choojs/choo">
    <img src="https://img.shields.io/travis/choojs/choo/master.svg?style=flat-square"
      alt="Build Status" />
  </a>
  <!-- Test Coverage -->
  <a href="https://codecov.io/github/choojs/choo">
    <img src="https://img.shields.io/codecov/c/github/choojs/choo/master.svg?style=flat-square"
      alt="Test Coverage" />
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/choo">
    <img src="https://img.shields.io/npm/dt/choo.svg?style=flat-square"
      alt="Download" />
  </a>
  <!-- Standard -->
  <a href="https://standardjs.com">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square"
      alt="Standard" />
  </a>
</div>

<br />
<br />

Node req is a facade to be **used by any framework** to read the request values. The [req](https://nodejs.org/api/http.html#http_class_http_incomingmessage) object of Node.js HTTP request is very bare bones and it can get cumbersome to consistently read information for a given request.

## Table of Contents

## Features
- **Handles inconsistencies** between different header names like `referer` and `referrer`.
- **Proxy headers support** from reverse proxies like `nginx` or `apache`. 
- **Content negotiation** using `Accept` headers.
- **Form method spoofing support**.
- **Helper methods**.

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

## API
