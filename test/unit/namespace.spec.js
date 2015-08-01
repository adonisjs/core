"use strict";

require('jasmine-expect');

let Namespace = require("../../src/Namespace/index"),
  path = require("path"),
  co = require("co"),
  _ = require("lodash");


Namespace.clear();

describe("Namespace", function() {

  it("should register items to ioc container", function() {
    Namespace.add("controllers", "App/Http/Controllers").register(path.join(__dirname, "./helpers/Controllers"));
    let items = _.keys(Namespace.list());
    expect(items).toBeNonEmptyArray();
    expect(items).toContain("App/Http/Controllers/AdminController");
    expect(items).toContain("App/Http/Controllers/UserController");
  });


  it("should register recursive directories", function() {

    Namespace.add("services", "App/Http/Services").register(path.join(__dirname, "./helpers/Services"));
    let items = Namespace.list();
    expect(items).toHaveMember("App/Http/Services/App/AppService");

  });


  it("should resolve controllers from namespace store", function(done) {

    co(function*(){
      return yield [Namespace.resolve("AdminController", "controllers"), Namespace.resolve("App/AppService", "services")]
    })
    .then(function(resolved){
      let AdminController = resolved[0];
      let AppService = resolved[1];
      expect(AdminController).toHaveMember("index");
      expect(AppService).toHaveMember("shout"); 
      done();
    });
  });


});