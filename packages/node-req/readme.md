# Node Req

> Read data of the Node.js HTTP request with no side-effects.

<br />

<p align="center">
  <a href="http://i1117.photobucket.com/albums/k594/thetutlage/poppins-1_zpsg867sqyl.png">
    <img src="http://i1117.photobucket.com/albums/k594/thetutlage/poppins-1_zpsg867sqyl.png" width="600px" />
  </a>
</p>

<br />

---

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Appveyor][appveyor-image]][appveyor-url]

`node-req` is an i/o module for parsing and returning values out of HTTP request object using helper methods.It is not express, neither connect. It is just an i/o module for parsing request object.

## See also

1. [node-res](http://npmjs.org/package/node-res)
2. [node-cookie](http://npmjs.org/package/node-cookie)

## Http Server

```javascript
var http = require('http')
var nodeReq = require('node-req')

http.createServer(function (req, res) {

  // get query string from req
  var query = nodeReq.get(req)

}).listen(3000)

```

Yes, that's all, `node-req` makes no assumption on how to add routes or handle HTTP requests. All it does it parse request object and return values out of it.

## What's different from express?

`express` is super cool, but it is a framework that has a lot more to offer than just parsing requests, where `node-req` is just a parser and will be an option based on your use case.

## Methods

#### get (req)
Returns request query string parameters.

```javascript
// req url is /user?name=doe

nodeReq.get(req)

// returns { name:'doe' }
```

#### method (req)
returns request method, or you can say HTTP verb

```javascript
nodeReq.method(req)

// returns GET,POST etc
```

#### headers (req)
returns request headers

```javascript
nodeReq.headers(req)
```

#### header (req, key)
returns request header for a given key

```javascript
nodeReq.header(req, 'Content-Type')
```

#### fresh (req, res)
test for request freshness based on E-tag and expires header

```javascript
nodeReq.fresh(req, res)
```

#### stale (req, res)
opposite of fresh

```javascript
nodeReq.stale(req, res)
```

#### ip (req, trust)
Returns request ip based on trusted proxy, check out [proxyaddr](https://www.npmjs.com/package/proxy-addr) for more info

```javascript
nodeReq.ip(req, ['127.0.0.0/8', '10.0.0.0/8'])
```

#### ips (req, trust)
Returns list of all IP address associated with a request, starting from closest to furthest based on trusted proxy. Also check out [proxyaddr](https://www.npmjs.com/package/proxy-addr) for more info

```javascript
nodeReq.ips(req, function (remoteAddress) {
  return remoteAddress === '127.0.0.1'
})
```

#### secure (req)
Is request from https ?

```javascript
nodeReq.secure(req)
```

#### subdomains (req, trust, offset=2)
List of subdomains on a given request. If trust is enabled it will refer to the `X-Forwarded-Host` header. Also check out [proxyaddr](https://www.npmjs.com/package/proxy-addr) for more info

```javascript
// request url gig.baz.com
nodeReq.subdomains(req, false)

// returns ['gig']
```

whereas

```javascript
// request url www.baz.com
nodeReq.subdomains(req)

// returns []
```

#### ajax (req)
determines whether a request is ajax or not based on `X-Requested-With` header.

```javascript
nodeReq.ajax(req)
```

#### pjax (req)
determines whether a request is pjax or not based on `X-Pjax` header

```javascript
nodeReq.pjax(req)
```

#### hostname (req, trust)
returns request hostname and if trust is enabled, it will refer to the `X-Forwarded-Host` header. Also check out [proxyaddr](https://www.npmjs.com/package/proxy-addr) for more info

```javascript
nodeReq.hostname(req, trust)
```

#### url (req)
returns request URL without the query string

```javascript
// request url /users?offset=0&limit=10

nodeReq.url(req)

// returns /users
```

#### originalUrl (req)
returns request originalUrl with query string

```javascript
// request url /users?offset=0&limit=10

nodeReq.originalUrl(req)

// returns /users?offset=0&limit=10
```

#### is (req, [types])
tells whether request is of certain type or not based on `Content-type` header.

```javascript
nodeReq.is(req, 'html')
// true
nodeReq.is(req, 'text/html')
// true
nodeReq.is(req, ['json','html'])
//true
```

#### accepts (req, [types])
tells whether request accepts data of certain type based on `Accepts` header.

```javascript
nodeReq.accepts(req, 'html')
// 'html'
nodeReq.accepts(req, 'text/html')
// 'text/html'
nodeReq.accepts(req, ['json','html'])
// 'html'
```

#### hasBody (req)
tells whether request has body to be read by any body parser.

```javascript
if (nodeReq.hasBody(req)) {
  req.on('data', function (chunk) {
    // ...
  })
}
```


[appveyor-image]: https://ci.appveyor.com/api/projects/status/github/poppinss/node-req?branch=master&svg=true&passingText=Passing%20On%20Windows
[appveyor-url]: https://ci.appveyor.com/project/thetutlage/node-req

[npm-image]: https://img.shields.io/npm/v/node-req.svg?style=flat-square
[npm-url]: https://npmjs.org/package/node-req

[travis-image]: https://img.shields.io/travis/poppinss/node-req/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/poppinss/node-req
