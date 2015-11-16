# Upgrade

This guide outlines the requirements and breakings changes to upgrade Adonis to lastest version. As Adonis follows, [semver](http://semver.org/) upgrade guides is only valid for major releases, for other minor/patch releases look into release notes.

- [Upgrading to v2](upgrading-to-v2)

## Upgrading to v2

The majority of `Adonis 2.x.x` code has been re-written from scratch to improve stability and performance. Since Io.js has been merged into NodeJs, we do not support Io.js officially.

## Breaking Changes

### Removed deferred providers

Deferred providers have been removed for the sake of simplicity, and you are expected to remove unwanted providers from `bootstrap/app.js` file as they will impact the application boot time.

### Ioc.bind does not type hint dependencies anymore and instead inject `app` as a parameter to the callback.

Earlier you have type hint dependencies inside your custom providers, which was bit ugly and less readable, and now the entire app instance is injected to the callback method, giving you the flexibility to fetch dependencies instead of type hinting

**earlier**

```javascript,line-numbers
class FileProvider extends ServiceProvider{
    
  * register () {
    this.app.bind('Addons/FileProvider', function (App_Src_Config,App_Src_Helpers) {
      return new File(Config,Helpers)
    })
  }

}
```

**now**

```javascript,line-numbers
class FileProvider extends ServiceProvider{
    
  * register () {
    this.app.bind('Addons/FileProvider', function (app) {
      const Config = app.use('App/Src/Config')
      const Helpers = app.use('App/Src/Helpers')
      return new File(Config,Helpers)
    })
  }

}
```

### Route.group `close` method has been removed.

Earlier you were supposed to close route groups when creating a group but now groups are smart enough to close themselves.

**earlier**
```javascript,line-numbers
Route.group('v1', function () {
  ...
}).prefix('/v1').close()
```

**npw**
```javascript,line-numbers
Route.group('v1', function () {
  ...
}).prefix('/v1')
```

### Global middleware runs even if no routes have been registered.

Earlier global middleware used to run when the request used to hit a valid registered route since this is not the ideal behavior, now they will be executed even if there are no registered routes.

### pm2 is removed.

pm2 is a daemon that runs node processes in a background and watch files for changes, the moment a file changes it will restart the server again. Also, it manages crashes in production by restarting the server again after the crash. 

We have removed pm2 for several reasons:

* First it's better to install pm2 globally and manage multiple servers, instead of using a separate pm2 for each application.
* Next we have plans to add services like `Vagrant` for seamless provisioning and will likely going to have a better solution than just dropping pm2 in your code base.

## Features Introduced

### Bunch of new service providers.

New service providers have been introduced to give you extra arms while writing your Node applications. Which includes: 

* Redis
* Encryption
* Hashing
* Mail
* Socket.Io

### Now providers can expose `extend` method to outside world to give support for extending features.

It is very important for service providers to be extended and offer more functionality, from `2.x.x` service providers can expose an API to outside world for same. For example

Session provider offers an API to add more drivers.

```javascript,line-number
Ioc.extend('Adonis/Src/Session', 'mongo', function (app) {
  return new MongoSessionStore()
})
```

### Seamless migrations

Under the hood, we still make use of `knex` to run database operations, but as Adonis is all about writing expressive code, we have added our migrations provider.

Now you can write migrations as follows

```javascript,line-numbers

const Schema = use('Schema')

class CreateUsersTable extends Schema {

  up () {
    this.create('users', function (table) {
      table.increments()
      table.string('username')
      table.timestamps()
    }) 
  }

}

```

### Database seeders

Database seeding is a concept of adding dummy data to database required to setup or test apps, and you can make use of below concept to seed databases on the fly.

```javascript,line-numbers
  
const Faker = use('Faker')
const Db = use('Db')

class UsersSeeder {

  * run () {
    const user = {
      username : Faker.name.username(),
      email    : Faker.name.email()
    }
    yield Db.insert(user)
  }

}

```
