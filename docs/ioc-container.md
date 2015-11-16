# IoC Container

To understand Ioc Container you should know what [Dependency Injection](/dependency-injection) is and why it is required ? IoC container is a layer to register and resolve dependencies out of a container that has several benefits.

- [Binding](#binding)
  - [bind](#bind)
  - [singleton](#singleton)
  - [alias](#alias)
- [Managers](#managers)
  - [extend](#extend)
- [Autoloading](#autoloading)
- [Resolving Dependencies](#resolving-dependencies)
  - [use](#use)
  - [make](#make)

## Binding

Binding objects to IoC container requires a namespace and a return value to be used while resolving the dependency.

### bind

```
Ioc.bind('App/Hello', function () {
  return 'Hello World!'
})
```

Above we created a binding with a unique namespace called `App/Hello` which returns a string called `Hello World`. Now this binding can be used by resolving it from IoC container.

```
const Hello = use('App/Hello')
```

### singleton

```
Ioc.singleton('App/Time', function () {
  return new Date().getTime()
})
```

Above we bind a singleton, which means the return value will be same every time we resolve this binding out of IoC container. The Ioc container has plenty of other benefits apart from registering and resolving the object.

### dependency injection

```
Ioc.bind('App/User', function (app) {
  const Redis = app.use('App/Redis')
  const Validator = app.use('App/Validator')
  return new User(Redis, Validator)
})
```

It is fairly simple to inject other bindings inside your binding. Also it does not matter whether `Redis` was registered before or after your binding, IoC container will resolve it for you as long as it has been registered.

## Managers

Managers are like your bindings but they have different purpose, `object` exposed via manager needs to have `extend` method and is used for extending implementations. Mail provider is an example of same

### registering Mail as a manager inside Ioc container
```
Ioc.manager('Adonis/Addons/Mail', Mail)
```

### extend 

```
Ioc.extend('Adonis/Addons/Mail', 'sendgrid', function () {
  return new SendGrid()
})
```

Using `extend` method you can extend `Mail` provider shipped with Adonis and add your own custom implementation, after this it is `Mail` provider's responsibility to understand and add `sendgrid` as a driver.

### alias

Alias is key/value pair to identify a namespace with it's alias. For example

1. `Adonis/Addons/Mail` has alias of `Mail`
2. `Adonis/Src/Route` has a alias of `Route`

```
Ioc.alias('Route','Adonis/Src/Route')
```

Alias works both for managers and bindings.

## Autoloading

Autoloading is handled cleverly by IoC container, it does not require all the files in memory instead while resolving dependencies it tries to make a sequence of `namespace` and see if required namespace is inside a given path. 

```
Ioc.autoload('App',path.join(__dirname,'./app'))
```

Now any file inside `./app` directory can be referenced as `App/<filePath>` as Adonis will lazy load it for you.

```
use('App/Http/routes')
use('App/Http/Middleware/Cors')
```

## Resolving Dependencies

Resolving dependencies is a sequential process and IoC container will try to find the requested namespace in given order.

1. looks for registered provider.
2. looks for alias and re-resolve provider with it's namespace
2. looks for autoloaded path.
3. try requiring as node module
4. throws an error, saying module not found.

### use

Use will return binded value using it's namespace

```
const Route = Ioc.use('Adonis/Src/Route')
```

### make

Make is smarter and will try to satisfy dependencies until the last injection and always returns an instance of class. Below is the list of rules followed by `make` method based upon data type.

1. **Class** - will introspect to find dependecies using `constructor` or `static inject` getter.
2. **Provider** - makes use of `use` method and returns value returned by provider as providers itself are responsible for satisfying their dependencies.
3. **Any other data type** - returns the original reference as IoC container does know how to make anything else from `Classes`.
4. **Autoload Namespace** Get value using `use` method.
  - if return value is a `Class` will try to follow the entire process again.
  - otherwise returns original return value.

```
Class UserController {
    
    static get inject () {
      return ["Adonis/Addonis/Mail","App/Model/User"]
    }

    constructor (Mail, User) {
      this.mail = Mail
      this.user = User
    }

}

const userController = make(UserController)
// or
const userController = make('App/Http/Controllers/UserController')
```
