# Node Req

> A facade over Node.js HTTP `req` object with no side-effects.

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Appveyor][appveyor-image]][appveyor-url]
[![Coveralls][coveralls-image]][coveralls-url]

<a href="http://res.cloudinary.com/adonisjs/image/upload/q_100/v1502279403/poppinss_z8uk2j.png">
<img src="http://res.cloudinary.com/adonisjs/image/upload/q_100/v1502279403/poppinss_z8uk2j.png" width="300px" align="right" vspace="20px" />
</a>

`node-req` is an i/o module for parsing and returning values out of HTTP request object using helper methods.

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

## API

* [get(req, [options])](#module_Request..get) ⇒ <code>Object</code>
* [method(req)](#module_Request..method) ⇒ <code>String</code>
* [headers(req)](#module_Request..headers) ⇒ <code>Object</code>
* [header(req, key)](#module_Request..header) ⇒ <code>String</code>
* [fresh(req, res)](#module_Request..fresh) ⇒ <code>Boolean</code>
* [stale(req, res)](#module_Request..stale) ⇒ <code>Boolean</code>
* [ip(req, [trust])](#module_Request..ip) ⇒ <code>String</code>
* [ips(req, [trust])](#module_Request..ips) ⇒ <code>Array</code>
* [protocol(req, [trust])](#module_Request..protocol) ⇒ <code>String</code>
* [secure(req)](#module_Request..secure) ⇒ <code>Boolean</code>
* [subdomains(req, [trust], [offset])](#module_Request..subdomains) ⇒ <code>Array</code>
* [ajax(req)](#module_Request..ajax) ⇒ <code>Boolean</code>
* [pjax(req)](#module_Request..pjax) ⇒ <code>Boolean</code>
* [hostname(req, [trust])](#module_Request..hostname) ⇒ <code>String</code>
* [url(req)](#module_Request..url) ⇒ <code>String</code>
* [originalUrl(req)](#module_Request..originalUrl) ⇒ <code>String</code>
* [is(req, keys)](#module_Request..is) ⇒ <code>String</code>
* [accepts(req, keys)](#module_Request..accepts) ⇒ <code>String</code>
* [types(req)](#module_Request..types) ⇒ <code>Array</code>
* [language(req, accepted)](#module_Request..language) ⇒ <code>String</code>
* [languages(req)](#module_Request..languages) ⇒ <code>Array</code>
* [encoding(req, accepted)](#module_Request..encoding) ⇒ <code>String</code>
* [encodings(req)](#module_Request..encodings) ⇒ <code>Array</code>
* [charset(req, accepted)](#module_Request..charset) ⇒ <code>String</code>
* [charsets(req)](#module_Request..charsets) ⇒ <code>Array</code>
* [hasBody(req)](#module_Request..hasBody) ⇒ <code>Boolean</code>

<a name="module_Request..get"></a>

### get(req, [options]) ⇒ <code>Object</code>
Parses query string from url an returns an object.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>http.IncomingMessage</code> |  |
| [options] | <code>Object</code> | Options are passed to https://www.npmjs.com/package/qs |

**Example**  
```js
const queryString = nodeReq.get(req)
```
<a name="module_Request..method"></a>

### method(req) ⇒ <code>String</code>
Returns the exact copy of `request.method`. Defined
[here](https://nodejs.org/api/http.html#http_message_method)

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

**Example**  
```js
const method = nodeReq.method(req)
```
<a name="module_Request..headers"></a>

### headers(req) ⇒ <code>Object</code>
Returns an object of headers for a given
request.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

**Example**  
```js
const headers = nodeReq.headers(req)
```
<a name="module_Request..header"></a>

### header(req, key) ⇒ <code>String</code>
Returns header value for a given key. Also
it will handle the inconsistencies between
`referer` and `referrer` header.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| key | <code>String</code> | 

**Example**  
```js
const authHeader = nodeReq.header(req, 'Authorization')
```
<a name="module_Request..fresh"></a>

### fresh(req, res) ⇒ <code>Boolean</code>
Returns the freshness of a response inside the client
cache. If client cache has the latest response, this
method will return `true`, otherwise it will return
`false`.

Also when HTTP header `Cache-Control: no-cache` is present
this method will return false everytime.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| res | <code>http.ServerResponse</code> | 

**Example**  
```js
if (nodeReq.fresh(req, res)) {
   res.writeHead(304)
}
```
<a name="module_Request..stale"></a>

### stale(req, res) ⇒ <code>Boolean</code>
This method is the opposite of the `nodeReq.fresh`

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| res | <code>http.ServerResponse</code> | 

**Example**  
```js
if (!nodeReq.stale(req, res)) {
   res.writeHead(304)
}
```
<a name="module_Request..ip"></a>

### ip(req, [trust]) ⇒ <code>String</code>
Returns the most trusted ip address for the HTTP
request. It will handle the use cases where your
server is behind a proxy.

Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
for the available options for `trust`.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| [trust] | <code>Mixed</code> | 

**Example**  
```js
nodeReq.ip(req, '127.0.0.1')
nodeReq.ip(req, ['::1/128', 'fe80::/10'])
```
<a name="module_Request..ips"></a>

### ips(req, [trust]) ⇒ <code>Array</code>
Returns list of all remote addresses ordered with
most trusted on the top of the list.

Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
for the available options for `trust`.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| [trust] | <code>Mixed</code> | 

**Example**  
```
nodeReq.ips(req, '127.0.0.1')
nodeReq.ips(req, ['::1/128', 'fe80::/10'])
```
<a name="module_Request..protocol"></a>

### protocol(req, [trust]) ⇒ <code>String</code>
Returns request protocol based upon encrypted
connection or X-Forwaded-Proto header.

Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
for the available options for `trust`.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| [trust] | <code>Mixed</code> | 

**Example**  
```
const protocol = nodeReq.protocol(req)
```
<a name="module_Request..secure"></a>

### secure(req) ⇒ <code>Boolean</code>
Looks for request protocol to check for
https existence or returns false.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

**Example**  
```
const isHttps = nodeReq.secure(req)
```
<a name="module_Request..subdomains"></a>

### subdomains(req, [trust], [offset]) ⇒ <code>Array</code>
Returns the request subdomains as an array. Also
it will make sure to exclude `www` from the
subdomains list.

Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
for the available options for `trust`.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| req | <code>http.IncomingMessage</code> |  |  |
| [trust] | <code>Mixed</code> |  |  |
| [offset] | <code>Number</code> | <code>2</code> | subdomain offset |

**Example**  
```js
const subdomains = nodeReq.subdomains(req)
```
<a name="module_Request..ajax"></a>

### ajax(req) ⇒ <code>Boolean</code>
Determines whether request is an ajax request
or not, based on X-Requested-With header.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

**Example**  
```js
if (nodeReq.ajax(req)) {
   res.writeHead(200, {"Content-type": "application/json"})
} else {
   res.writeHead(200, {"Content-type": "text/html"})
}
```
<a name="module_Request..pjax"></a>

### pjax(req) ⇒ <code>Boolean</code>
Tells whether request has X-Pjax
header or not.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

**Example**  
```js
if (nodeReq.pjax(req)) {
   // return partial content
} else {
   // full page refresh
}
```
<a name="module_Request..hostname"></a>

### hostname(req, [trust]) ⇒ <code>String</code>
Returns the hostname of HTTP request.

Make sure to check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
for the available options for `trust`.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| [trust] | <code>Mixed</code> | 

**Example**  
```js
const hostname = nodeReq.hostname(request)
```
<a name="module_Request..url"></a>

### url(req) ⇒ <code>String</code>
Returns request url after removing the query
string.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

**Example**  
```js
const url = nodeReq.url(request)
```
<a name="module_Request..originalUrl"></a>

### originalUrl(req) ⇒ <code>String</code>
Returns the untouched url.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

**Example**  
```js
const url = nodeReq.originalUrl(request)
```
<a name="module_Request..is"></a>

### is(req, keys) ⇒ <code>String</code>
Tells whether request accept content of a given
type or not (based on **Content-type**) header.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| keys | <code>Mixed</code> | 

**Example**  
```js
// req.headers.content-type = 'application/json'

nodeReq.is(req, ['json']) // json
nodeReq.is(req, ['json', 'html']) // json
nodeReq.is(req, ['application/*']) // application/json

nodeReq.is(req, ['html']) // '<empty string>'
```
<a name="module_Request..accepts"></a>

### accepts(req, keys) ⇒ <code>String</code>
Return the best possible response accepted by the
client. This is based on the `Accept` header.
[Learn more about it](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| keys | <code>Mixed</code> | 

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
<a name="module_Request..types"></a>

### types(req) ⇒ <code>Array</code>
This method is similar to {{#crossLink "Request/accepts"}}{{/crossLink}},
instead it will return an array of types from most to least preferred
one.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

<a name="module_Request..language"></a>

### language(req, accepted) ⇒ <code>String</code>
Returns one of the most preferrable language.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| accepted | <code>Array</code> | 

<a name="module_Request..languages"></a>

### languages(req) ⇒ <code>Array</code>
Returns list of all accepted languages from most
to least preferred one.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

<a name="module_Request..encoding"></a>

### encoding(req, accepted) ⇒ <code>String</code>
Returns the best maching encoding

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| accepted | <code>Array</code> | 

<a name="module_Request..encodings"></a>

### encodings(req) ⇒ <code>Array</code>
Returns list of all encodings from most
to least preferred one.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

<a name="module_Request..charset"></a>

### charset(req, accepted) ⇒ <code>String</code>
Returns the best maching charset based upon
`Accept-Charset` header.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 
| accepted | <code>Array</code> | 

<a name="module_Request..charsets"></a>

### charsets(req) ⇒ <code>Array</code>
Returns a list of all charsets from most
to least preferred one based upon
`Accept-Charset` header.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

<a name="module_Request..hasBody"></a>

### hasBody(req) ⇒ <code>Boolean</code>
Tells whether request has body or
not to be read by any body parser.

**Kind**: inner method of [<code>Request</code>](#module_Request)  

| Param | Type |
| --- | --- |
| req | <code>http.IncomingMessage</code> | 

**Example**  
```js
if (nodeReq.hasBody(request)) {
   // use body parser
}
```

[appveyor-image]: https://img.shields.io/appveyor/ci/thetutlage/node-req/master.svg?style=flat-square
[appveyor-url]: https://ci.appveyor.com/project/thetutlage/node-req

[npm-image]: https://img.shields.io/npm/v/node-req.svg?style=flat-square
[npm-url]: https://npmjs.org/package/node-req

[travis-image]: https://img.shields.io/travis/poppinss/node-req/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/poppinss/node-req

[coveralls-image]: https://img.shields.io/coveralls/poppinss/node-req/develop.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/poppinss/node-req 
