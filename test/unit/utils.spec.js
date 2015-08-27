"use strict";

const ServerHelpers = require("../../src/Server/helpers")
const chai = require('chai')
const expect = chai.expect


describe("Utils", function() {

  it("should parse controller method string", function() {

    let parsed = ServerHelpers.namespace_to_controller_instance("App","HomeController.index");
    expect(parsed).to.be.an('object');
    expect(parsed).to.have.property("controller");
    expect(parsed).to.have.property("action");
    expect(parsed.action).to.equal("index");
    expect(parsed.controller).to.equal("App/Http/Controllers/HomeController");

  });


  it("should parse pre namespaced controller method string", function() {

    let parsed = ServerHelpers.namespace_to_controller_instance("App","App/Http/Controllers/HomeController.index");
    expect(parsed).to.be.an('object');
    expect(parsed).to.have.property("controller");
    expect(parsed).to.have.property("action");
    expect(parsed.action).to.equal("index");
    expect(parsed.controller).to.equal("App/Http/Controllers/HomeController");

  });



  it("should parse nested controller with dot convention", function() {

    let parsed = ServerHelpers.namespace_to_controller_instance("App","User/HomeController.index");
    expect(parsed).to.be.an('object');
    expect(parsed).to.have.property("controller");
    expect(parsed).to.have.property("action");
    expect(parsed.action).to.equal("index");
    expect(parsed.controller).to.equal("App/Http/Controllers/User/HomeController");

  });

});
