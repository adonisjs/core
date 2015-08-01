"use strict";

require('jasmine-expect');

let Namespace = require("../../src/Namespace/index"),
  path = require("path"),
  _ = require("lodash");


describe("Namespace", function() {

  it("should register items to ioc container", function() {
    Namespace.add("controllers", "App/Http/Controllers").register(path.join(__dirname, "./helpers/Controllers"));
    let items = _.keys(Namespace.list());
    expect(items).toBeNonEmptyArray();
    expect(items).toBeArrayOfSize(4);
  });


  it("should register recursive directories", function() {

    Namespace.add("services", "App/Http/Services").register(path.join(__dirname, "./helpers/Services"));
    let items = Namespace.list();
    expect(items).toHaveMember("App/Http/Services/App/AppService");

  });


  it("should resolve controllers from namespace store", function() {

    let AdminController = Namespace.resolve("AdminController", "controllers");
    let AppService = Namespace.resolve("App/AppService", "services");
    expect(AdminController).toHaveMember("index");
    expect(AppService).toHaveMember("shout");

  });


});