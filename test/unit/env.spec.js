"use strict";

const Env = require("../../src/Env/index")
const chai = require('chai')
const expect = chai.expect
const path = require("path")

describe("Env", function() {

  it("should load .env file to proccess.env", function(done) {
    Env.load(path.join(__dirname, "./helpers/.env"));
    expect(process.env.APP_NAME).to.equal("adonis");
    expect(process.env.APP_ENV).to.equal("local");
    done()
  });

});
