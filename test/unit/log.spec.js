'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const Log = require('../../src/Log')
const chai = require('chai')
const sinon = require('sinon')
const stdout = require('test-console').stderr
const expect = chai.expect
const Config = {
  get: function (key) {
    if (key === 'app.syslog') {
      return {}
    }
  }
}

describe('Log', function () {
  const methods = ['info', 'warn', 'error', 'debug', 'verbose', 'silly']

  it(`should have methods ${methods.join(', ')}`, function () {
    const log = new Log(Config)

    methods.forEach((method) => {
      expect(log).to.have.property(method)
    })
  })

  it('should log messages to console', function () {
    const log = new Log(Config)

    methods.forEach((method) => {
      const inspect = stdout.inspect()
      let msg = ''
      log[method](`This is test message for ${method}`)
      inspect.restore()
      inspect.output.forEach((item) => {
        msg += item
      })

      expect(msg).to.contain(method)
      expect(msg).to.contain('adonis:framework')
      expect(msg).to.contain(`This is test message for ${method}`)
    })
  })

  it('should throw if syslog method is not allowed', function () {
    const log = new Log(Config)

    try {
      log._sendToSyslog('something', 'test message')
    } catch (err) {
      expect(err.message).to.equal('E_INVALID_PARAMETER: Invalid syslog log method type.')
      expect(err.status).to.equal(500)
    }
  })

  it('should log to syslog', function () {
    const log = new Log(Config)
    const inspect = stdout.inspect()

    sinon.spy(log, '_sendToSyslog')
    log.info('syslog test')
    inspect.restore()
    expect(log._sendToSyslog.calledOnce).to.equal(true)
  })
})
