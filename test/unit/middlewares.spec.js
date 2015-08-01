"use strict";
require('jasmine-expect');


let Middlewares = require("../../src/Middlewares/index");


describe("Middlewares", function() {


  beforeEach(function() {
    Middlewares.clear();
  });

  it("should register an array of class as global middlewares", function() {


    class CSRF {

    }

    class Auth {

    }

    Middlewares.global([CSRF, Auth]);

    let registered_middlewares = Middlewares.get();

    expect(registered_middlewares).toBeNonEmptyArray();
    expect(registered_middlewares[0]).toEqual(CSRF);
    expect(registered_middlewares[1]).toEqual(Auth);


  });


  it("should register an object of named middlewares", function() {

    class UserAuth {

    }

    Middlewares.named({
      "auth": UserAuth
    });

    let registered_middlewares = Middlewares.get(["auth"]);

    expect(registered_middlewares).toBeNonEmptyArray();
    expect(registered_middlewares[0]).toEqual(UserAuth);
    expect(registered_middlewares[1]).toBe(undefined);

  });


  it("should return all global and requested named middlewares", function() {

    class CSRF {

    }

    class UserAuth {

    }

    Middlewares.global([CSRF]);
    Middlewares.named({
      "auth": UserAuth
    });

    let registered_middlewares = Middlewares.get(["auth"]);

    expect(registered_middlewares).toBeNonEmptyArray();
    expect(registered_middlewares[0]).toEqual(CSRF);
    expect(registered_middlewares[1]).toBe(UserAuth);


  });


  it("should return middlewares that have handle method and are instantiable", function() {

    class CSRF {

    }

    class UserAuth {

      * handle() {}

    }

    Middlewares.global([CSRF, UserAuth]);
    let registered_middlewares = Middlewares.get();
    let middlewares_ready_for_use = Middlewares.filter(registered_middlewares);

    expect(middlewares_ready_for_use).toBeNonEmptyArray();
    expect(middlewares_ready_for_use[0].__proto__).toBeObject();
    expect(middlewares_ready_for_use[0].handle).toEqual(jasmine.any(Function));

  })


});