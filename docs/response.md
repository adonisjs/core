# Response

The response object is also sent along with every single HTTP request and has a handful of methods to respond properly from a given request.

- [Making Response](#making-response)
- [Cookies](#cookies)
- [Redirects](#redirects)
- [Making Views](#making-views)

## Making Response

For the most basic response, you can make use of send method

```javascript,line-numbers
* index (request, response) {
  response.send("Hello world")
}
```

#### send (body)
```javascript,line-numbers
response.send("Hello world")
```

#### status (statusCode)
```javascript,line-numbers
response.status(200).send("Hello world")
```

#### json (body)
```javascript,line-numbers
response.json({drink:"coffee"})
```

#### jsonp (body)
```javascript,line-numbers
response.jsonp({drink:"coffee"})
```

#### vary (field)
adds vary header to response

```javascript,line-numbers
response.vary('Accept')
```

#### header (key, value)
adds key/value pair to response header

```javascript,line-numbers
response.header('Content-Type', 'application/json')
```

## Cookies 

You can also attach cookies to your response

#### cookie (key, value, [, options])

```javascript,line-numbers
response.cookie('name', 'value')
// or
response.cookie('name', 'value', options)
```

**options**

| Property | type | description |
|-----------|-------|------------|
| path      | String | cookie path |
| expires      | Date | absolute expiration date for the cookie (Date object) |
| maxAge      | String | relative max age of the cookie from when the client receives it (seconds) |
| domain      | String | domain for the cookie |
| secure      | Boolean | Marks the cookie to be used with HTTPS only |
| httpOnly      | Boolean | Flags the cookie to be accessible only by the web server |
| firstPartyOnly | Boolean | Defines cookie to be used by the same domain only |

#### clearCookie (key [,options])
removes existing cookie from response

```javascript,line-numbers
response.clearCookie('name')
```

## Redirects 

Redirecting to a different path is a common requirement for a web applications. As Adonis is a tightly integrated framework, you can leverage out of box redirection mechanisms.

#### redirect (url)

```javascript,line-numbers
response.redirect('http://foo.com')
```
#### route
redirects to a given route

```javascript,line-numbers
response.route('/user/:id', {id: 1})
```

or you can use the name for a named route.

```javascript,line-numbers
Routes
.get('/user/:id','UsersController.show')
.as('profile')
```

```javascript,line-numbers
response.route('profile', {id: 1})
```

## Making Views

Response class includes a helper to make views using response object.

#### view (path [, data])

```javascript,line-numbers
const view = yield response.view('index')
response.send(view)

// or

const view = yield response.view('profile', {username: 'foo'})
response.send(view)
```
