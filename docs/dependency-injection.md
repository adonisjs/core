# Dependency Injection

Dependency Injection is a very simple term of removing all hard coded references to a module/library to injected arguments. In Javascript, dependency injection is everywhere but does not have magical API to make you feel good.

- [Dependency Injection in general](#di-in-general)
- [Dependency Injection in Adonis](#di-in-adonis)

## Dependency Injection in general

Let's create a simple module and see what problems we may face without having dependency injection and how simple it is to inject dependencies. To create a module in NodeJs, we make use of `CommonJs` module patterns that let us expose our code using `module.exports`.

### Vanilla approach
```
var User = require('./models/User')
var Validator = require('./lib/Validator')

module.exports = {
  
  create: function () {
    Validator.validate()
    User.create()
  }

}

```

Now to test the above module we need to have `User` model and `Validator` library in place. In short we cannot `mock` the require modules while testing our code.

<div class="__note">
  <p><strong>Note:-</strong> Mocking is a concept of faking objects by passing dummy implementation which is usually considered as a good practice. </p>
</div>

### Injecting via arguments

```
module.exports = function (User, Validator) {
  
  return  {
    create: function () {
      Validator.validate()
      User.create()
    }
  }

}
```

Above module accepts `User` and `Validator` as arguments, which really can be anything. This approach gives us flexibility as we easily `mock` dependencies while testing our module.

It is fundamentally correct but has downsides as it is not maintainable for large applications. Take the below scenario

1. A module name `request.js` is dependent upon `User` model

```
module.exports = function (User) {
  
}
```

2. Now `User` model is dependent upon a `baseModel`

```
module.exports = function User (BaseModel) {
  
}
```

3. Also `baseModel` is dependent upon some database library

```
module.exports = function BaseModel (Mysql) {
  
}
```

4. Now Mysql is dependent upon some config library and so on.

This huge chain of dependencies makes hard to maintain a long-term project as to require one module you have to require a chain of modules, which may look something like this.

```
var config = require('./config')
var Mysql = require('Mysql')(config)
var BaseModel = require('./baseModel')(Mysql)
var User = require('./User')(BaseModel)
var register = require('./register')(User)
```

This list may grow depending upon the nature of your project and seriously is not maintainable, that is why always you will find everyone hard-coding dependencies right into the module.

## Dependency Injection In Adonis

Adonis tries to solve out this problem with the help of Ioc container, which stores and make dependencies using namespaces. Make sure to read [Ioc Container](/ioc-container) documentation.


```
class UserController {
  
  constructor (User, Config, Validator) {
    this.user = User
    this.config = Config
    this.validator = Validator
  }

}

var userController = Ioc.make(UserController)
```

`.make` method will resolve dependencies out of the IoC container and inject them to class constructors, keeping it readable, maintainable and testable at the same time.
