"use strict";

require('jasmine-expect');
let HttpException = require("../../src/HttpException/index");

describe("HttpException", function() {

  it("should throw an error using HttpException class", function() {
    let error = new HttpException(404, "Page not found");
    expect(error.statusCode).toEqual(404);
    expect(error.message).toEqual("Page not found");
  });


  it("should be instance of HttpException", function() {
    let HttpException1 = require("../../src/HttpException/index");
    let error = new HttpException1(404, "Page not found");
    expect(error instanceof HttpException).toEqual(true);
  });

});