# Node Req

> Read data of the Node.js HTTP request with no side-effects.

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Appveyor][appveyor-image]][appveyor-url]
[![Coveralls][coveralls-image]][coveralls-url]

<a href="http://i1117.photobucket.com/albums/k594/thetutlage/poppins-1_zpsg867sqyl.png">
<img src="http://i1117.photobucket.com/albums/k594/thetutlage/poppins-1_zpsg867sqyl.png" width="300px" align="right" vspace="20px" />
</a>

`node-req` is an i/o module for parsing and returning values out of HTTP request object using helper methods.

It is not express, neither connect. It is just an i/o module for parsing request object.

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

### get
Parses query string from url an returns
an object.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| options | Object | No | Options are passed to https://www.npmjs.com/package/qs |

**Returns**
Object

**Example**
```js
const queryString = nodeReq.get(req)
```

----
### method
Returns the exact copy of `request.method`. Defined
[here](https://nodejs.org/api/http.html#http_message_method)

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
String

**Example**
```js
const method = nodeReq.method(req)
```

----
### headers
Returns an object of headers for a given
request.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
Object

**Example**
```js
const headers = nodeReq.headers(req)
```

----
### header
Returns header value for a given key. Also
it will handle the inconsistencies between
`referer` and `referrer` header.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| key | String | Yes | &nbsp; |

**Returns**
String

**Example**
```js
const authHeader = nodeReq.header(req, 'Authorization')
```

----
### fresh
Returns the freshness of a response inside the client
cache. If client cache has the latest response, this
method will return `true`, otherwise it will return
`false`.

Also when HTTP header `Cache-Control: no-cache` is present
this method will return false everytime.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| response | Object | Yes | &nbsp; |

**Returns**
Boolean

**Example**
```js
if (nodeReq.fresh(req, res)) {
   res.writeHead(304)
}
```

----
### stale
This method is the opposite of the {{#crossLink "Request/fresh"}}{{/crossLink}} method

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
Boolean

**Example**
```js
if (!nodeReq.stale(req, res)) {
   res.writeHead(304)
}
```

----
### ip
Returns the most trusted ip address for the HTTP
request. It will handle the use cases where your
server is behind a proxy.

Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
for the available options for `trust`.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| trust | Mixed | No | &nbsp; |

**Returns**
String

**Example**
```js
nodeReq.ip(req, '127.0.0.1')
nodeReq.ip(req, ['::1/128', 'fe80::/10'])
```

----
### ips
Returns list of all remote addresses ordered with
most trusted on the top of the list.

Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
for the available options for `trust`.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| trust | Mixed | No | &nbsp; |

**Returns**
Array

**Example**
```
nodeReq.ips(req, '127.0.0.1')
nodeReq.ips(req, ['::1/128', 'fe80::/10'])
```

----
### protocol
Returns request protocol based upon encrypted
connection or X-Forwaded-Proto header.

Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
for the available options for `trust`.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| trust | Mixed | No | &nbsp; |

**Returns**
String

**Example**
```
const protocol = nodeReq.protocol(req)
```

----
### secure
Looks for request protocol to check for
https existence or returns false.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
Boolean

**Example**
```
const isHttps = nodeReq.secure(req)
```

----
### subdomains
Returns the request subdomains as an array. Also
it will make sure to exclude `www` from the
subdomains list.

Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
for the available options for `trust`.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| trust | Mixed | No | &nbsp; |
| offset  | Number | No | subdomain offset |

**Returns**
Array

**Example**
```js
const subdomains = nodeReq.subdomains(req)
```

----
### ajax
Determines whether request is an ajax request
or not, based on X-Requested-With header.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
Boolean

**Example**
```js
if (nodeReq.ajax(req)) {
   res.writeHead(200, {"Content-type": "application/json"})
} else {
   res.writeHead(200, {"Content-type": "text/html"})
}
```

----
### pjax
Tells whether request has X-Pjax
header or not.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
Boolean

**Example**
```js
if (nodeReq.pjax(req)) {
   // return partial content
} else {
   // full page refresh
}
```

----
### hostname
Returns the hostname of HTTP request.

Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
for the available options for `trust`.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| trust | Mixed | No | &nbsp; |

**Returns**
String

**Example**
```js
const hostname = nodeReq.hostname(request)
```

----
### url
Returns request url after removing the query
string.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
String

**Example**
```js
const url = nodeReq.url(request)
```

----
### originalUrl
Returns the untouched url.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
String

**Example**
```js
const url = nodeReq.originalUrl(request)
```

----
### is
Tells whether request accept content of a given
type or not (based on **Content-type**) header.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| keys | Mixed | Yes | &nbsp; |

**Returns**
String

**Example**
```js
// req.headers.content-type = 'application/json'

nodeReq.is(req, ['json']) // json
nodeReq.is(req, ['json', 'html']) // json
nodeReq.is(req, ['application/*']) // application/json

nodeReq.is(req, ['html']) // '<empty string>'
```

----
### accepts
Return the best possible response accepted by the
client. This is based on the `Accept` header.
[Learn more about it](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| keys | Mixed | Yes | &nbsp; |

**Returns**
String

**Example**
```js
const type = nodeReq.accepts(req, ['json', 'html'])

switch(type) {
 case 'json':
   res.setHeader('Content-Type', 'application/json')
   res.write('{"hello":"world!"}')
   break

 case 'html':
   res.setHeader('Content-Type', 'text/html')
   res.write('<b>hello, world!</b>')
   break

 default:
   res.setHeader('Content-Type', 'text/plain')
   res.write('hello, world!')
}
```

----
### types
This method is similar to {{#crossLink "Request/accepts"}}{{/crossLink}},
instead it will return an array of types from most to least preferred
one.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
Array

----
### language
Returns one of the most preferrable language.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| accepted | Array | Yes | &nbsp; |

**Returns**
String

----
### languages
Returns list of all accepted languages from most
to least preferred one.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
Array

----
### encoding
Returns the best maching encoding

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| accepted | Array | Yes | &nbsp; |

**Returns**
String

----
### encodings
Returns list of all encodings from most
to least preferred one.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
Array

----
### charset
Returns the best maching charset based upon
`Accept-Charset` header.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |
| accepted | Array | Yes | &nbsp; |

**Returns**
String

----
### charsets
Returns a list of all charsets from most
to least preferred one based upon
`Accept-Charset` header.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
Array

----
### hasBody
Tells whether request has body or
not to be read by any body parser.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| request | Object | Yes | &nbsp; |

**Returns**
Boolean

**Example**
```js
if (nodeReq.hasBody(request)) {
   // use body parser
}
```

----


[appveyor-image]: https://img.shields.io/appveyor/ci/thetutlage/node-req/master.svg?style=flat-square

[appveyor-url]: https://ci.appveyor.com/project/thetutlage/node-req

[npm-image]: https://img.shields.io/npm/v/node-req.svg?style=flat-square
[npm-url]: https://npmjs.org/package/node-req

[travis-image]: https://img.shields.io/travis/poppinss/node-req/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/poppinss/node-req

[coveralls-image]: https://img.shields.io/coveralls/poppinss/node-req/develop.svg?style=flat-square

[coveralls-url]: https://coveralls.io/github/poppinss/node-req
