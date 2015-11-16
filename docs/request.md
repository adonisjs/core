# Request 

The request object is sent along with every HTTP request and has a handful of methods to read request information. 

- [Reading request information](#reading-request-information)
- [Request methods](#request-methods)
  - [Headers](#headers)
  - [Cookies](#cookies)
  - [Content negotiation](#content-negotiation)
  - [Session Management](#session-management)
  - [Flash Messages](#flash-messages)
- [Uploading Files](#uploading-files)

## Reading request information

As Adonis receives a new HTTP request, it injects `request` object to all registered middleware and route handler, which can be used to read/modify values from a given request.

```javascript,line-numbers
Route.get('/', function * (request, response) {
  const name = request.input('name')
})
```

## Request methods

Below is the list of methods can be used to retrieve information for a given HTTP request.

#### input (key [, defaultValue])
returns value for a given key from `get` and `post` values, if value does not exists it will return defaultValue

```javascript,line-numbers
request.input('drink', 'coffee')
```

#### all ()
returns `get` and `post` values

```javascript,line-numbers
request.all()
```

#### only ('keys...')
returns `get` and `post` values for only requested keys

```javascript,line-numbers
request.only('name', 'age')
// or
request.only(['name', 'age'])
```

#### except ('keys...')
returns all `get` and `post` values except defined keys

```javascript,line-numbers
request.except('password')
// or
request.except(['password'])
```

#### get 
returns all `get` values

```javascript,line-numbers
request.get()
```

#### post 
returns all `post` values

```javascript,line-numbers
request.post()
```
#### ajax
identifies whether request is an ajax request or not

```javascript,line-numbers
request.ajax()
```

#### pjax
identifies whether a request is pjax based upon `X-PJAX` header

```javascript,line-numbers
request.pjax()
```

#### method 
returns request method/http verb

```javascript,line-numbers
request.method()
```

#### url
returns request URL without the query string

```javascript,line-numbers
request.url()
```

#### originalUrl
returns request actual url

```javascript,line-numbers
request.originalUrl()
```

#### hostname
returns request hostname

```javascript,line-numbers
request.hostname()
```

#### ip
returns request ip address

```javascript,line-numbers
request.ip()
```

#### ips
returns list of all IP addresses associated to a given request

```javascript,line-numbers
request.ips()
```

#### param (key [, defaultValue])
returns value from route params for a given key, or returns default value.

```javascript,line-numbers
Route.get('/user/:id', ...)

request.param('id', 1)
```

#### params
returns values for all route params

```javascript,line-numbers
request.params()
```


### Headers

#### header (key [, defaultValue])
returns value from request headers for a given key or fallback to a default value.

```javascript,line-numbers
request.header('x-time', new Date().getTime())
```

#### headers
returns all headers for a given request.

```javascript,line-numbers
request.headers()
```

### Cookies
Cookies in Adonis are encrypted and signed to prevent them from getting modified. Make sure to set `APP_KEY` inside `.env` otherwise, cookies will be sent plain.

#### cookie (key [, defaultValue])
returns value for a given key from request cookies, or returns default value

```javascript,line-numbers
request.cookie('cart_value', 0)
```

#### cookies
returns all cookies for a given request

```javascript,line-numbers
request.cookies()
```

### Content negotiation
Content negotiation is a term used to find out the best matching response type for a given request. Adonis provides helpful methods to get best possible response content type for a given request.

#### is (keys...)
Tells whether a request is of the certain type or not.

```javascript,line-numbers
const isPlain = request.is('html','text')

if(isPlain) {
  // do something
}
```

#### accepts (keys...)
get the best matching return type for a given request.

```javascript,line-numbers
const type = request.accepts('json','html','text')

switch (type) {
  case 'json':
    response.json({hello:"world"})
    break
  case 'html':
    response.send('<h1>Hello world</h1>')
    break
  case 'text':
    response.send('Hello world')
    break
}

```

### Session Management

Adonis has out of the box support for managing sessions to short-lived flash messages. Make sure to setup `APP_KEY` inside `.env` file to keep your sessions encrypted.

#### drivers

Below is the list of drivers supported by session provider and they can be configured inside `config/sesssion.js` file.

1. file - Saved inside a local file on server
2. cookie - Values are encrypted and sent back to browser as cookies
3. redis - Values are saved inside a redis store.

#### put (key, value)

```javascript,line-numbers
yield request.session.put('username', 'doe')
// or
yield request.session.put({username:'doe'})
```

#### get (key)

```javascript,line-numbers
yield request.session.get('username')
```

#### all

```javascript,line-numbers
yield request.session.all()
```

#### forget (key)

remove key/value pair from session

```javascript,line-numbers
yield request.session.forget('username')
```

#### pull (key)

fetch and remove key/value pair from session

```javascript,line-numbers
yield request.session.pull('username')
```

### Flash Messages

Flash messages are stored inside session for a single request and will be cleared after the redirect. A good example will be to send form errors back on form submission failure.

```javascript,line-numbers
* store (request, response) {
  
  yield Validator.validate(rules, request.all())
  
  if(validator.fails()){
    yield request.flashAll()
    return response.redirect('back')
  }
}
```
and then inside your view you can do

```twig,line-numbers
<input type="text" name="username" value="{{ old('username') }}" / >
<input type="text" name="email" value="{{ old('email') }}" / >
```

#### flashAll
it will send current request data from `request.all()`

```javascript,line-numbers
yield request.flashAll()
```

#### flashExcept (keys...)
it will send current request data except values of defined keys

```javascript,line-numbers
yield request.flashExcept('password')
```

#### flashOnly (keys...)
it will values of requested keys from request data, `null` values will be ignored

```javascript,line-numbers
yield request.flashOnly('username','email')
```

#### flash
flash a custom object

```javascript,line-numbers
yield request.flash({username:'foo'})
```

#### old (key [, defaultValue])
`old` will pull value for a given from Flash Messages. Also available as a helper method inside `views`.

```javascript,line-numbers
request.old('username', 'doe')
```

## Uploading Files

File uploads are handled with care in Adonis, and each uploaded file is an instance of `File` class that has a ton of methods to save and check file metadata.

#### file (key)
returns uploaded file instance using it's key

```javascript,line-numbers
const profile = request.file('profile')
```

and now you perform following operations on selected file.

#### clientName
returns file name from client machine

```javascript,line-numbers
profile.clientName()
```

#### exists
finding whether the file exists inside temp path or not

```javascript,line-numbers
if(!profile.exists()){
  response.send("Unable to upload file")
}
```

#### tmpPath
uploaded file temporary path

```javascript,line-numbers
profile.tmpPath()
```

#### clientSize
file size at the time of uploading

```javascript,line-numbers
profile.clientSize()
```

#### extension

```javascript,line-numbers
profile.extension()
```

#### mimeType

```javascript,line-numbers
profile.mimeType()
```

#### move (path [, newName])
moving file to a given location

```javascript,line-numbers
yield profile.move(toPath)
// or
yield profile.move(toPath, newName)
```

#### moved
finding if move operation was successful or not

```javascript,line-numbers
if(!profile.moved()){
  return profile.errors().message
}
```

#### uploadPath
the complete path where a file was moved

```javascript,line-numbers
profile.uploadPath()
```

#### uploadName
complete path with file name where a file was moved

```javascript,line-numbers
profile.uploadName()
```

#### errors
errors occurred while moving a file, it will be an instance of `Error` class

```javascript,line-numbers
if(!profile.moved()){
  return profile.errors().message
}
```
