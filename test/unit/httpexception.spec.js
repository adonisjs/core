/* global describe, it */

'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

let HttpException = require('../../src/HttpException/index')
const chai = require('chai')
const expect = chai.expect

describe('HttpException', function () {
  it('should throw an error using HttpException class', function () {
    let error = new HttpException(404, 'Page not found')
    expect(error.status).to.equal(404)
    expect(error.message).to.equal('Page not found')
  })

  it('should be instance of HttpException', function () {
    let HttpException1 = require('../../src/HttpException/index')
    let error = new HttpException1(404, 'Page not found')
    expect(error instanceof HttpException).to.equal(true)
  })

  it('should set error status to 503 when status has not be defined', function () {
    let error = new HttpException('Something went found')
    expect(error.status).to.equal(503)
  })
})
