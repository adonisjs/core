  "use strict";

  /**
   * @author      - Harminder Virk
   * @package     - adonis-http-dispatcher
   * @description - Integeration tests to figure out how stuff looks under same roof.
   */


  let Dispatcher = require("../../index"),
    api = require("hippie"),
    path = require("path"),
    Routes = Dispatcher.Router,
    HttpException = Dispatcher.HttpException,
    Middlewares = Dispatcher.Middlewares,
    Static = Dispatcher.Static,
    Namespace = Dispatcher.Namespace,
    Server = Dispatcher.Server;


  api.assert.showDiff = true;

  let getData = function(data,timeout) {
    return new Promise(function(resolve, reject) {
      if (!timeout) {
        resolve(data);
      }else{
        setTimeout(function(){
          resolve(data);
        },timeout);
      }
    });
  }

  describe("Basic Http Server", function() {

    afterEach(function() {
      Server.stop();
    })

    it("should spyn a server on given port and respond to a registered route", function(done) {

      let usersToReturn = [{
        username: 'foo',
        age: 22
      }, {
        username: 'bar',
        age: 25
      }];

      Routes.get("/user", function*(request, response) {
        let users = yield getData(usersToReturn);
        if (users) {
          response.status(200).send(users);
        }
      });

      Server.start(3000);

      api()
        .json()
        .base('http://localhost:3000')
        .get('/user')
        .expectStatus(200)
        .expectBody(usersToReturn)
        .end(function(err, res, body) {
          if (err) done(err)
          done();
        })

    });


    it("should start a server and attach multiple middlewares to a given route", function(done) {

      let usersToReturn = [{
        username: 'foo',
        age: 22
      }, {
        username: 'bar',
        age: 25
      }];

      class Auth {

        * handle(request, response, next) {
          if (request.headers().framework) {
            yield next;
          }
        }

      }

      class Admin {

        * handle(request, response, next) {
          if (request.headers().framework === 'adonis') {
            yield next;
          }
        }

      }

      Middlewares.named({
        "auth": Auth,
        "admin": Admin
      });

      Routes.get("/frameworks", function*(request, response) {
        let users = yield getData(usersToReturn);
        if (users) {
          response.status(200).send(users);
        }
      }).middlewares(["auth", "admin"]);

      Server.start(3000);

      api()
        .json()
        .header("framework", "adonis")
        .base('http://localhost:3000')
        .get('/frameworks')
        .expectStatus(200)
        .expectBody(usersToReturn)
        .end(function(err, res, body) {
          if (err) done(err)
          done();
        })

    });



    it("should abort request when middlewares do not yield to next", function(done) {


      let errorMessage = "Hulk should be green";

      class HulkTest {

        * handle(request, response, next) {
          if (request.headers().color && request.headers().color === 'green') {
            yield next;
          } else {
            throw new HttpException(400, errorMessage)
          }
        }

      }


      Middlewares.named({
        "auth": HulkTest
      });

      Routes.get("/hulk", function*(request, response) {
        let users = yield getUsers();
        if (users) {
          response.status(200).send(users);
        }
      }).middlewares(["auth"]);

      Server.start(3000);

      api()
        .header("color", "red")
        .base('http://localhost:3000')
        .get('/hulk')
        .expectStatus(400)
        .expectBody(errorMessage)
        .end(function(err, res, body) {
          if (err) done(err.stack)
          done();
        })

    });


    it("should serve static resources", function(done) {

      Static.public("dist",path.join(__dirname, "./public"));

      Server.start(3000);

      api()
        .base('http://localhost:3000')
        .get('/dist/style.css')
        .expectStatus(200)
        .end(function(err, res, body) {
          if (err) done(err.stack)
          let cssRegex = new RegExp("(?:\\s*\\S+\\s*{[^}]*})+","g");
          expect(cssRegex.test(body)).toBe(true);
          done();
        })

    });



    it("should resolve controllers using controller string and using resource method", function(done) {

      Namespace.add("controllers","App/Http/Controllers").register(path.join(__dirname,"./Controllers"));
      Routes.resource("/friends","FriendsController");
      
      let friendsToReturn = [
        {
          name: 'foo'
        },
        {
          name: 'bar'
        }
      ];

      Server.start(3000);

      api()
        .json()
        .base('http://localhost:3000')
        .get('/friends')
        .expectStatus(200)
        .expectBody(friendsToReturn)
        .end(function(err, res, body) {
          if (err) done(err.stack)
          done();
        })

    });

    it("should resolve nested controllers using controller string", function(done) {

      Routes.group("admin",function(){
        Routes.resource("/friends","Admin.FriendsController");
      }).prefix("/admin").close();
      
      let friendsToReturn = [
        {
          name: 'admin-foo'
        },
        {
          name: 'admin-bar'
        }
      ];

      Server.start(3000);

      api()
        .json()
        .base('http://localhost:3000')
        .get('/admin/friends')
        .expectStatus(200)
        .expectBody(friendsToReturn)
        .end(function(err, res, body) {
          if (err) done(err.stack)
          done();
        })

    });


    it("should resolve nested controllers using controller string with full namespace", function(done) {

      Routes.group("admin",function(){
        Routes.resource("/friends","App/Http/Controllers/Admin/FriendsController");
      }).prefix("/v1/admin").close();
      
      let friendsToReturn = [
        {
          name: 'admin-foo'
        },
        {
          name: 'admin-bar'
        }
      ];

      Server.start(3000);

      api()
        .json()
        .base('http://localhost:3000')
        .get('/v1/admin/friends')
        .expectStatus(200)
        .expectBody(friendsToReturn)
        .end(function(err, res, body) {
          if (err) done(err.stack)
          done();
        })

    });



    it("should serve static resources even when all routes are listening to a single controller action", function(done) {

      Routes.get("*",function*(request,response){
        response.send("foo");
      });
      Static.public("dist",path.join(__dirname, "./public"));

      Server.start(3000);

      api()
        .base('http://localhost:3000')
        .get('/dist/style.css')
        .expectStatus(200)
        .end(function(err, res, body) {
          if (err) done(err.stack)
          let cssRegex = new RegExp("(?:\\s*\\S+\\s*{[^}]*})+","g");
          expect(cssRegex.test(body)).toBe(true);
          done();
        })

    });

  });