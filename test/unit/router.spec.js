"use strict";

require('jasmine-expect');

let Router = require("../../src/Router/index");

describe("Router", function() {


  beforeEach(function() {
    Router.new();
  });


  it("should register route with GET verb", function(done) {
    Router.get("/", "HomeController.index");
    let routes = Router.routes();
    expect(routes).toBeArray();
    expect(routes[0].route).toBe("/");
    expect(routes[0].handler).toBe("HomeController.index");
    expect(routes[0].verb).toContain("GET");
    done()
  });



  it("should register route with POST verb", function(done) {
    Router.post("/", "HomeController.store");
    let routes = Router.routes();
    expect(routes).toBeArray();
    expect(routes[0].route).toBe("/");
    expect(routes[0].handler).toBe("HomeController.store");
    expect(routes[0].verb).toContain("POST");
    done()
  });



  it("should register route with PUT verb", function(done) {
    Router.put("/:id", "HomeController.update");
    let routes = Router.routes();
    expect(routes).toBeArray();
    expect(routes[0].route).toBe("/:id");
    expect(routes[0].handler).toBe("HomeController.update");
    expect(routes[0].verb).toContain("PUT");
    done()
  });



  it("should register route with DELETE verb", function(done) {
    Router.delete("/:id", "HomeController.destroy");
    let routes = Router.routes();
    expect(routes).toBeArray();
    expect(routes[0].route).toBe("/:id");
    expect(routes[0].handler).toBe("HomeController.destroy");
    expect(routes[0].verb).toContain("DELETE");
    done()
  });



  it("should resolve route registerd with multiple verbs", function(done) {
    Router.any(["GET", "POST"], "/admin", "AdminController.setGet");
    let admin = Router.resolve("/admin", "GET");
    expect(admin.route).toBe("/admin");
    expect(admin.handler).toBe("AdminController.setGet");
    expect(admin.verb).toBe("GET");
    done()
  });



  it("should not resolve route registerd with verb", function(done) {
    Router.any(["GET", "POST"], "/admin", "AdminController.setGet");
    let admin = Router.resolve("/admin", "PUT");
    expect(admin).toBeEmptyObject();
    done()
  });



  it("should resolve registered route", function(done) {
    Router.get("/", function() {});
    let home = Router.resolve("/", "GET");
    expect(home.route).toBe("/");
    expect(home.handler).toBeFunction();
    done();
  });



  it("should resolve route with route params", function(done) {
    Router.get("/user/:id", function() {});
    let user = Router.resolve("/user/1", "GET");
    expect(user.route).toBe("/user/:id");
    expect(user.params).toHaveMember("id");
    expect(user.params.id).toBe("1");
    done();
  });



  it("should make url given defined route and params", function(done) {
    let url = Router.url("/user/:id", {
      id: 1
    });
    expect(url).toBe("/user/1");
    done();
  });



  it("should make url using route name", function(done) {
    Router.get("/user/:id").as("userProfile");
    let url = Router.url("userProfile", {
      id: 1
    });
    expect(url).toBe("/user/1");
    done();
  });



  it("should make url with defined route without params", function(done) {
    let url = Router.url("/user");
    expect(url).toBe("/user");
    done();
  });


  it("should attach array of middlewares to route", function(done) {
    Router.get("/secure").middlewares(["auth", "csrf"]);
    let secure = Router.resolve("/secure", "GET", "127.0.0.1");
    expect(secure.middlewares).toBeNonEmptyArray();
    expect(secure.middlewares).toBeArrayOfSize(2);
    done()
  });


  it("should attach array of middlewares to group of routes", function(done) {

    Router.group("admin", function() {
      Router.get("/users");
      Router.get("/staff");
    }).middlewares(["auth"]).close();

    let secureUsers = Router.resolve("/users", "GET");
    let secureStaff = Router.resolve("/staff", "GET");

    expect(secureUsers.middlewares).toBeNonEmptyArray();
    expect(secureUsers.middlewares).toBeArrayOfSize(1);
    expect(secureUsers.middlewares[0]).toBe("auth");
    expect(secureStaff.middlewares).toBeNonEmptyArray();
    expect(secureStaff.middlewares).toBeArrayOfSize(1);
    expect(secureStaff.middlewares[0]).toBe("auth");

    done()
  });



  it("should define named routes", function(done) {
    Router.get("/cities/:id/zones", "HomeController").as("CityZones");
    let CityZones = Router.resolve("/cities/1/zones", "GET");
    expect(CityZones.name).toBe("CityZones");
    done();
  });


  it("should create a group of routes and prefix them", function(done) {

    Router.group("admin", function() {
      Router.get("/dance", function() {});
    }).prefix("/admin").close();

    let jumpingAdmin = Router.resolve("/admin/dance", "GET");
    expect(jumpingAdmin.group).toBe("admin");
    done();
  });


  it("should create a group of routes and make them listen to a different subdomain", function(done) {

    Router.group("v1", function() {
      Router.get("/dance", function() {});
    }).domain("v1.myapp.com").close();

    let jumpingAdmin = Router.resolve("/dance", "GET", "v1.myapp.com");
    expect(jumpingAdmin.subdomain).toBe("v1.myapp.com");
    expect(jumpingAdmin.group).toBe("v1");
    done();
  });


  it("should resolve routes for subdomains", function(done) {

    Router.get("/users", "UsersController.index");

    Router.group("v1", function() {
      Router.get("/users", "V1.UsersController.index");
    }).domain("v1.virk.com").close();

    let jumpingAdmin = Router.resolve("/users", "GET", "v1.virk.com");
    expect(jumpingAdmin.handler).toBe("V1.UsersController.index");
    done();
  });


  it("should resolve dynamic subdomains for routes", function(done) {

    Router.group("v1", function() {
      Router.get("/users", "V1.UsersController.profile");
    }).domain(":name.app.com").close();

    let jumpingAdmin = Router.resolve("/users", "GET", "virk.app.com");
    expect(jumpingAdmin.handler).toBe("V1.UsersController.profile");
    expect(jumpingAdmin.params.name).toBe("virk");
    done();
  });


  it("prefix and subdomains should work fine together", function(done) {

    Router.get("/v2/users", function() {});

    Router.group("v2", function() {
      Router.get("/users", "V2.UsersController.profile");
    }).domain(":name.app.com").prefix("/v2").close();

    let jumpingAdmin = Router.resolve("/v2/users", "GET", "virk.app.com");
    expect(jumpingAdmin.handler).toBe("V2.UsersController.profile");
    expect(jumpingAdmin.params.name).toBe("virk");
    done();
  });



  it("should make route resources based out of conventions", function(done) {

    Router.resource("/users", "UsersController");

    let getUsers = Router.resolve("/users", "GET");
    let makeUser = Router.resolve("/users", "POST");
    let showUser = Router.resolve("/users/1", "GET");
    let updateUser = Router.resolve("/users/1", "PUT");
    let deleteUser = Router.resolve("/users/1", "DELETE");

    expect(getUsers.handler).toBe("UsersController.index");
    expect(makeUser.handler).toBe("UsersController.store");
    expect(showUser.handler).toBe("UsersController.show");
    expect(updateUser.handler).toBe("UsersController.update");
    expect(deleteUser.handler).toBe("UsersController.destroy");

    done();

  });


  it("should make route resources based out of conventions inside groups", function(done) {

    Router.group("v1", function() {
      Router.resource("/users", "UsersController");
    }).prefix("/v1").close();

    let getUsers = Router.resolve("/v1/users", "GET");
    let makeUser = Router.resolve("/v1/users", "POST");
    let showUser = Router.resolve("/v1/users/1", "GET");
    let updateUser = Router.resolve("/v1/users/1", "PUT");
    let deleteUser = Router.resolve("/v1/users/1", "DELETE");

    expect(getUsers.handler).toBe("UsersController.index");
    expect(makeUser.handler).toBe("UsersController.store");
    expect(showUser.handler).toBe("UsersController.show");
    expect(updateUser.handler).toBe("UsersController.update");
    expect(deleteUser.handler).toBe("UsersController.destroy");

    done();

  });

});