# Controllers

Controllers in MVC is a layer between your views and models that respond to incoming requests registered using routes. They have plenty of benefits over route `Closures`.

You start by creating controllers inside `app/Http/Controllers` directory and reference controllers with their filename within your routes. Alternatively you can make use of `ace command` to generate a new controller.

```bash,line-numbers
node ace make:controller Home
// or
node ace make:controller Home --plain
```

- [Defining Controllers](#defining-controllers)
- [Resourceful Controllers](#resourceful-controllers)
- [Dependency Injection](#dependency-injection)
  - [type hinting dependencies](#type-hinting-dependencies)
  - [via inject method](#via-inject-method)

## Defining Controllers

Controllers are defined as ES6 classes and can have multiple generator functions.

```javascript,line-numbers
class UserController {
  
  *index (request, response) {
    let users = yield Users.all()
    response.json(users.toJSON())
  }

}

module.exports = HomeController
```

### Inside routes.js file

```javascript,line-numbers
Route.get('/users', 'UserController.index')
```

## Resourceful Controllers

Resourceful routes define multiple routes and attach conventional methods to them under single route definition.

```javascript,line-numbers
Route.resource('/users', 'UserController')
```

Following routes will be bound to UserController

route | verb | action
-------| -----|-----------
/users | GET | UserController.index
/users | POST | UserController.store
/users/:id | GET | UserController.show
/users/:id | PUT | UserController.update
/users/:id | DELETE | UserController.destroy

## Dependency Injection

One of the biggest benefits of using controllers over closures is they support solid dependency injection out of the box. Dependencies are injected using the namespace as everything is registered and resolved out of IoC container.

### using inject method

```javascript,line-numbers
class UserController {
  
  static get inject () {
    return ["App/Model/User"]
  }
  
  constructor (User) {
    this.user = User
  }

}
```

`inject` method returns an array of Dependencies to be injected inside your controller, and behind the scenes Adonis will make an instance of `UserController` using `Ioc.make` method, which will inject all required dependencies.

The benefit of this approach is it makes your controllers testable as you can mock dependencies while testing them.

### type hinting dependencies

Type hinting is an alternate to `static inject` method as IoC container will try to make your dependencies by reading your constructor arguments. While using constructor type hinting you have to replace `/` with `_` for your namespace.

```
class UserController {

  constructor (App_Model_User) {
    this.user = App_Model_User
  }

}
```

<div class="note">
  <p> <strong> Note: </strong> Typehinting has no advantage over `static inject` method, it is all about personal preference. </p>
</div>
