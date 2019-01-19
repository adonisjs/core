<a name="3.0.3"></a>
## [3.0.3](https://github.com/poppinss/node-req/compare/3.0.2...3.0.3) (2019-01-19)



<a name="3.0.2"></a>
## [3.0.2](https://github.com/poppinss/node-req/compare/3.0.1...3.0.2) (2019-01-09)



<a name="3.0.1"></a>
## [3.0.1](https://github.com/poppinss/node-req/compare/3.0.0...3.0.1) (2019-01-05)


### Bug Fixes

* install missing dependencies ([a201e54](https://github.com/poppinss/node-req/commit/a201e54))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/poppinss/node-req/compare/v2.1.1...v3.0.0) (2019-01-05)


### Features

* rewrite in typescript ([b2e5e28](https://github.com/poppinss/node-req/commit/b2e5e28))
* **Request:** working version of request class ([d14fff2](https://github.com/poppinss/node-req/commit/d14fff2))

## Breaking Changes
Version 2.x.x was a simple object that used to receive `req` and `res` as parameters on every method. However, newer version (3.0.0) is a class that accepts `req` and `res` as class constructor.

### Import

**Earlier**
```js
const nodeReq = require('node-req')
```

**Now**
```js
const { Request } = require('node-req')
```

### Method params

**Earlier**
```js
const nodeReq = require('node-req')

http.createServer((req, res) => {
  nodeReq.headers(req)
})
```

**Now**
```js
const { Request } = require('node-req')

http.createServer((req, res) => {
  const request = new Request(req, res)
  request.headers()
})
```


<a name="2.1.1"></a>
## [2.1.1](https://github.com/poppinss/node-req/compare/v2.1.0...v2.1.1) (2018-08-21)



<a name="2.1.0"></a>
# [2.1.0](https://github.com/poppinss/node-req/compare/v2.0.1...v2.1.0) (2018-01-18)



<a name="2.0.1"></a>
## [2.0.1](https://github.com/poppinss/node-req/compare/v2.0.0...v2.0.1) (2017-06-12)



<a name="2.0.0"></a>
# 2.0.0 (2017-06-09)


### Features

* **request:** add accept-* headers support ([b7009e3](https://github.com/poppinss/node-req/commit/b7009e3))

