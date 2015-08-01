"use strict";
require('jasmine-expect');

/*
|--------------------------------------------------------------------------
|  Response Tests
|--------------------------------------------------------------------------
| 
|  Response makes use of nodeRes , which itself is tested so there is
|  no point testing it's expectations.
|
*/


let Response = require("../../src/Response/index");

describe("Response", function() {


  it("should extend node-res prototype", function(done) {

    let response = new Response({}, {}),
      proto = response.__proto__;

    expect(proto).toBeNonEmptyObject();
    expect(proto).toHaveMember("header");
    expect(proto).toHaveMember("end");
    expect(proto).toHaveMember("send");
    expect(proto).toHaveMember("view");

    done()
  });

});