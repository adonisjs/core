# Middleware

Middleware are filters to your routes, and often used for modifying or authenticating requests. You start by defining your middleware inside `app/Http/Middleware` directory, where each `Es6` class represents a single middleware.

- [Defining Middleware](#defining-middleware)
- [Registering Middleware](#registering-middleware)
  - [global](#global)
  - [named](#named)

## Defining Middleware

To create a middleware you need to create a file inside the Middleware directory, or you can make use of `ace command` to generate a middleware for you.

```bash-line-numbers
node ace make:middleware Auth
```

Above command will create a new class called `Auth.js` with `handle` method to respond to an incoming request.

```javascript,line-numbers
class Auth {
  
  *handle (request, response, next) {
    if(!auth) {
      response.unAuthorized("Login first")
      return
    }
    yield next
  }

}
```

### handle

handle method is called automatically on your middleware and should `yield next` to handover request to next middleware or to route action.

## Registering Middleware

So far you have created a middleware but have not registered it yet, same can be done inside `app/Http/kernel.js` file. 

### global middleware

Global middleware are defined as an array and get's executed in same order on every request. Good examples of same are `BodyParser` and `CORS`, which are shipped with the installation of Adonis.

```javascript,line-numbers
// app/Http/kernel.js
const globalMiddleware = [
  'App/Http/Middleware/BodyParser',
  'App/Http/Middleware/Cors'
]
```

### named middleware

Named middleware are stored as `key/value` pairs where keys are later referenced on routes.

```javascript,line-numbers
// app/Http/kernel.js
const namedMiddleware = {
  'auth' : 'App/Http/Middleware/Auth'
}
```

```javascript,line-numbers
// app/Http/routes.js
Route.get('/profile/:id', 'UserController.show').middleware(['auth'])
```
