"use strict";

const Env = require("../../src/Env/index")
const chai = require('chai')
const expect = chai.expect
const path = require("path")

describe("Env", function() {

  it("should load .env file to proccess.env", function() {
    Env.load(path.join(__dirname, "./helpers/.env"));
    expect(process.env.APP_NAME).to.equal("adonis");
    expect(process.env.APP_ENV).to.equal("local");
  });

  it("should get values using get method from process.env", function() {
    expect(Env.get("APP_NAME")).to.equal("adonis");
  });

  it("should set values to process.env using set method", function() {
    Env.set("APP_NAME","adonisv1")
    expect(Env.get("APP_NAME")).to.equal("adonisv1");
  });
});
