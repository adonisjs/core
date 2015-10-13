# Node Req

`node-req` is a loosely couple i/o module to parsing and returning values out of http request object using helper methods.It is not express, neither connect. It is just an i/o module for parsing request object.

## See also

1. node-res
2. node-cookie

## Http Server

```javascript
var http = require('http')
var nodeReq = require('node-req')

http.createServer(function (req, res) {
  
  // get query string from req  
  var get = nodeReq.get(req)

}).listen(3000)

```

Yes that's all , `node-req` makes no assumption on how to add router or handle http reqs. All it does it parse request object and return values out of it.

## What's different from express ?

`express` is super cool, but it is a framework which has lot more to offer than just parsing requests, where `node-req`
is just a parser and will be an option based on your use case.

## Methods

#### get (req)
returns request query string parameters

```javascript
// req url is /user?name=doe

nodeReq.get(req)

// returns {name:'doe'}
```

#### post (req)
return request post body [ it does not parse req body, make use of formidable ]

```javascript
nodeReq.post(req)

// reads from req._body
```

#### method (req)
returns request method or you can say http verb

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

#### ips (req)
Returns list of all ip address associated with a request, starting from closest to furthest based on trusted proxy

```javascript
nodeReq.ips(req)
```

#### secure (req)
Is request from https ?

```javascript
nodeReq.secure(req)
```

#### subdomains (req, offset=2)
List of subdomains on a given request

```javascript
// request url gig.baz.com
nodeReq.subdomains(req)

// returns ['gig']
```

where as

```javascript
// request url www.baz.com
nodeReq.subdomains(req)

// returns []
```

#### ajax (req)
determines whether request is ajax or not based on `X-Requested-With` header

```javascript
nodeReq.ajax(req)
```

#### pjax (req)
determines whether request is pjax or not based on `X-Pjax` header

```javascript
nodeReq.pjax(req)
```

#### hostname (req)
returns request hostname

```javascript
nodeReq.hostname(req)
```

#### url (req)
returns request url without query string

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
nodeReq.is('html')
// true
nodeReq.is('text/html')
// true
nodeReq.is(['json','html'])
//true
```

#### accepts (req, [types])
tells whether request accepts data of certain type based on `Accepts` header.

```javascript
nodeReq.accepts('html')
// 'html'
nodeReq.accepts('text/html')
// 'text/html'
nodeReq.accepts(['json','html'])
// 'html'
```

