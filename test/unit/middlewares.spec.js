'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Middlewares = require('../../src/Middlewares/index')
const chai = require('chai')
const expect = chai.expect

describe('Middlewares', function () {
  beforeEach(function () {
    Middlewares.clear()
  })

  it('should register an array of class as global middlewares', function () {
    class CSRF {

    }

    class Auth {

    }

    Middlewares.global([CSRF, Auth])

    let registered_middlewares = Middlewares.get()

    expect(registered_middlewares).to.be.an('array')
    expect(registered_middlewares[0]).to.equal(CSRF)
    expect(registered_middlewares[1]).to.equal(Auth)

  })

  it('should register an object of named middlewares', function () {
    class UserAuth {

    }

    Middlewares.named({
      'auth': UserAuth
    })

    let registered_middlewares = Middlewares.get(['auth'])

    expect(registered_middlewares).to.be.an('array')
    expect(registered_middlewares[0]).to.equal(UserAuth)
    expect(registered_middlewares[1]).to.equal(undefined)

  })

  it('should return all global and requested named middlewares', function () {
    class CSRF {

    }

    class UserAuth {

    }

    Middlewares.global([CSRF])
    Middlewares.named({
      'auth': UserAuth
    })

    let registered_middlewares = Middlewares.get(['auth'])

    expect(registered_middlewares).to.be.an('array')
    expect(registered_middlewares[0]).to.equal(CSRF)
    expect(registered_middlewares[1]).to.equal(UserAuth)

  })

})
