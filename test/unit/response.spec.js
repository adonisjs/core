'use strict'

/*
|--------------------------------------------------------------------------
|  Response Tests
|--------------------------------------------------------------------------
|
|  Response makes use of nodeRes , which itself is tested so there is
|  no point testing it's expectations.
|
*/

const Response = require('../../src/Response/index')
const View = require('../../src/View/index')
const path = require('path')
const chai = require('chai')
const http = require('http')
const supertest = require('supertest')
const expect = chai.expect
const co = require('co')

describe('Response', function () {
  it('should extend node-res prototype', function (done) {
    let response = new Response({}, {})
    let proto = response.__proto__

    expect(proto).to.be.an('object')
    expect(proto).to.have.property('header')
    expect(proto).to.have.property('end')
    expect(proto).to.have.property('send')
    expect(proto).to.have.property('view')
    done()
  })
})
