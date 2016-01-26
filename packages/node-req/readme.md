# Node Req

![](http://i1117.photobucket.com/albums/k594/thetutlage/poppins-1_zpsg867sqyl.png)

![](https://img.shields.io/travis/poppinss/node-req.svg)
[![Coverage Status](https://coveralls.io/repos/poppinss/node-req/badge.svg?branch=master&service=github)](https://coveralls.io/github/poppinss/node-req?branch=master)

`node-req` is an i/o module for parsing and returning values out of HTTP request object using helper methods.It is not express, neither connect. It is just an i/o module for parsing request object.

## See also

1. node-res
2. node-cookie

## Http 

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
returns request query string parameters

```javascript
// req url is /user?name=doe

nodeReq.get(req)

// returns {name:'doe'}
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

## License 
(The MIT License)

Copyright (c) 2015 Poppins

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
