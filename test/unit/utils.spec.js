"use strict";

require('jasmine-expect');


let ServerHelpers = require("../../src/Server/helpers");


describe("Utils", function() {

  it("should parse controller method string", function() {

    let parsed = ServerHelpers.namespace_to_controller_instance("HomeController.index");
    expect(parsed).toBeNonEmptyObject();
    expect(parsed).toHaveMember("is_namespaced");
    expect(parsed).toHaveMember("controller");
    expect(parsed).toHaveMember("action");
    expect(parsed.action).toBe("index");
    expect(parsed.controller).toBe("HomeController");
    expect(parsed.is_namespaced).toBe(false);

  });


  it("should parse pre namespaced controller method string", function() {

    let parsed = ServerHelpers.namespace_to_controller_instance("App/Http/Controllers/HomeController.index");
    expect(parsed).toBeNonEmptyObject();
    expect(parsed).toHaveMember("is_namespaced");
    expect(parsed).toHaveMember("controller");
    expect(parsed).toHaveMember("action");
    expect(parsed.action).toBe("index");
    expect(parsed.controller).toBe("App/Http/Controllers/HomeController");
    expect(parsed.is_namespaced).toBe(true);

  });



  it("should parse nested controller with dot convention", function() {

    let parsed = ServerHelpers.namespace_to_controller_instance("User.HomeController.index");
    expect(parsed).toBeNonEmptyObject();
    expect(parsed).toHaveMember("is_namespaced");
    expect(parsed).toHaveMember("controller");
    expect(parsed).toHaveMember("action");
    expect(parsed.action).toBe("index");
    expect(parsed.controller).toBe("User/HomeController");
    expect(parsed.is_namespaced).toBe(false);

  });

});