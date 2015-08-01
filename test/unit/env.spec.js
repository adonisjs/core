"use strict";
require('jasmine-expect');

let Env = require("../../src/Env/index"),
  path = require("path");

describe("Env", function() {


  it("should load .env file to proccess.env", function(done) {
    Env.load(path.join(__dirname, "./helpers/.env"));
    expect(process.env.APP_NAME).toBe("adonis");
    expect(process.env.APP_ENV).toBe("local");
    done()
  });

});