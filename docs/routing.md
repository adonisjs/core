# Routing

Routes help you in exposing endpoints to outside world that can be used to interact with your application. Adonis has rich routing vocabulary makes it easier for you to define routes and their actions.

- [Basic routing](#basic-routing)
  - [Route closures](#route-closures)
  - [Http Verbs](#http-verbs)
  - [Multiple verbs](#multiple-verbs)
  - [Named routes](#named-routes)
- [Route parameters](#route-parameters)
  - [Required parameters](#required-parameters)
  - [Optional parameters](#optional-parameters)
- [Route controllers](#route-controllers)
- [Middleware](#middleware)
- [Groups](#groups)
  - [prefix](#prefix)
  - [domain](#domain)
- [Form Method Spoofing](#form-method-spoofing)
- [CORS](#cors)

## Basic routing

You start by defining your routes inside `app/Http/routes.js` file by requiring `Route` provider. Always try to keep your routes file clean and never include any application logic inside this file.

### Route closures

```javascript,line-numbers
const Route = use('Route')

Route.get('/', function * () {
  
  // handle request

})
```

`Closures` are callbacks and oftenly accepted as the second parameter to your route definition. Note here route closure has a special `*` symbol after function keyword. This defines a [generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) in ES6. You won't have to worry much about generators here, just remember they make it easier to write async code by removing callbacks completely from your code.

### Http verbs

#### get request

```javascript,line-numbers
Route.get('/', function * () {
  
})
```

#### post request

```javascript,line-numbers
Route.post('/', function * () {
  
})
```

#### put request

```javascript,line-numbers
Route.put('/', function * () {
  
})
```

#### delete request

```javascript,line-numbers
Route.delete('/', function * () {
  
})
```

#### patch request

```javascript,line-numbers
Route.patch('/', function * () {
  
})
```

### Multiple verbs

You can respond with the same action for multiple requests with following methods.

#### match

```javascript,line-numbers
Route.match(['get','post'], '/', function * () {
  
})
```

#### any
any method will include **get,post,put,patch,delete,options**

```javascript,line-numbers
Route.any('/', function * () {
  
})
```

### Named Routes

Think of named routes as giving a unique name to a given route. It is helpful when you want to generate fully qualified URL to routes with a shortcut.

```javascript,line-numbers
Route.get('/users/profile/:id', ... ).as('profile')
```

Let's say you want to reference the above route inside a different file, so there are multiple ways of doing it.

#### Bad

```markup,line-numbers
/users/profile/1
```

#### Better

```markup,line-numbers
Route.url('/users/profile/:id', {id:1})
```

#### Good

```markup,line-numbers
Route.url('profile', {id:1})
```

Named routes give you the power to make use of the last example, which is readable and also keeps your code DRY as after changing the initial route definition you won't have to change a single line of code elsewhere.

## Route parameters

Route parameters are transparent dynamic segments on URL. With Adonis, you can define optional and required parameters and get values for them in route actions.

### Required parameters

```javascript,line-numbers
Route.get('/make/:drink', function * (request, response) {
  const drink = request.param('drink')
  response.send(`I will make ${drink} for you`)
})
```

Here `:drink` is a required parameter on the route that needs to be present to invoke defined action.

### Optional parameters

```javascript,line-numbers
Route.get('/make/:drink?', function (request, response) {
  const drink = request.param('drink', 'coffee')
  response.send(`I will make ${drink} for you`)
})
```

`?` defines optional parameters, also `param` method accepts another argument that is the default value for param that does not exist.` 

## Route controllers

`Closures` are good but not great, to keep your routes file clean it's always good practice to make use of controllers. Controllers are used in the combination of `Controller.method` as string.

```javascript,line-numbers
Route.get('/', 'HomeController.index')
```

Above route will look for `index` method inside `HomeController` which is an ES6 class.

```javascript,line-numbers
// app/Http/Controllers/HomeController.js

class HomeController {
  
  * index (request, response) {
    response.send("Hello World! ")
  }  

}

module.exports = HomeController
```

## Middleware

Expectations of middleware should be satisfied before a request can reach your route actions. You can read more about [Middleware](/middleware) as they make it super easy to write maintainable and DRY code.

To attach middleware to your route, you can make use of `middleware` method.

```javascript,line-numbers
Route.get('/profile', 'ProfileController.show').middleware(['auth'])
```

## Groups

Think of them as grouping your routes under common settings or configuration without declaring the same thing on individual routes.

```javascript,line-numbers

Route.group('name', function () {
  
  // all routes under this callback are part of this group

})

```

### prefix

prefix group of routes with defined path.

```javascript,line-numbers
Route.group('version1', function () {
  
  Route.get('/', ...)

}).prefix('/v1')
```

### domain

register group of routes for a given domain only

```javascript,line-numbers
Route.group('blog', function () {

  Route.get('/post', ...)

}).domain('blog.example.org')
```

### middleware

middleware can also be attached to a group of routes

```javascript,line-numbers
Route.group('blog', function () {

  Route.get('/post', ...)

}).middleware(['auth'])
```


## Form Method Spoofing

Html form tags do not support all verbs apart from `GET` and `POST`,  where method spoofing helps you in defining HTTP verbs as a form field.

```html,line-numbers

<form method="POST" action="/user/1">
  <input type="hidden" name="_method" value="PUT">
</form>

```

## CORS

Cross-origin resource sharing is a way to allow HTTP requests coming in from different domain. It is very common in AJAX requests where the browser will block all Cross domain requests if they are not enabled or allowed by the server. Read more about [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS)

Adonis ships a lean middleware that can be used on routes to enable CORS.

### For all routes

Define CORS as a `global middleware` inside `app/Http/kernel.js` file to enable it for all routes.

### For specific routes

```javascript,line-numbers
Route.group('cors', function () {
  
}).middleware(['Cors'])
```

### Settings

`config/cors.js` has a list of options can be used to configure CORS.

```javascript,line-numbers
module.exports = {
  
  origin    : "*",
  methods   : "GET, POST, PUT",
  headers   : "Content-type, Authorization"

}
```
