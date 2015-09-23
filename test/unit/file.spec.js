/* global describe, it, beforeEach */

'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const File = require('../../src/File/index')
const Request = require('../../src/Request/index')
const path = require('path')
const co = require('co')
const chai = require('chai')
const formidable = require('formidable')
const http = require('http')
const supertest = require('supertest')
const fse = require('co-fs-extra')
const expect = chai.expect

/**
 * dummy file object required to mock
 * file uploads and run tests on
 * top of it
 * @type {Object}
 */
let dummyFileObject = {
  size: 235,
  path: '/var/folders/mb/281v60z50ml4tw4qk9x25hr40000gn/T/upload_762fa0b6befe47e2d07968764394646c',
  name: 'npm-logo.svg',
  type: 'image/svg+xml',
  mtime: 'Mon Aug 17 2015 13:14:21 GMT+0530 (IST)',
  length: undefined,
  filename: undefined,
  mime: undefined
}

describe('Files', function () {
  /**
   * clearning uploads directory before running tests, also making
   * sure uploads directory exists inside given directory
   */
  beforeEach(function (done) {
    co(function * () {
      return yield [fse.emptyDir(path.join(__dirname, './uploads')), fse.ensureDir(path.join(__dirname, './uploads'))]
    }).then(function () {
      done()
    }).catch(done)
  })

  /**
   * testing mimeType method expectations to return mime type
   */
  it('should return mimtype for a given file', function () {
    var file = new File(dummyFileObject)
    expect(file.mimeType()).to.equal(dummyFileObject.type)
  })

  /**
   * testing extension method expectations to make sure it returns
   * file extension
   */
  it('should return extension for a given file', function () {
    var file = new File(dummyFileObject)
    expect(file.extension()).to.equal('svg')
  })

  /**
   * testing clientName method expectations to make sure it returns
   * uploaded file name on clients machine
   */
  it('should return client name for the uploaded file', function () {
    var file = new File(dummyFileObject)
    expect(file.clientName()).to.equal(dummyFileObject.name)
  })

  /**
   * testing clientSize method expectations to make sure it returns
   * uploaded file size on clients machine
   */
  it('should return size for a given file', function () {
    var file = new File(dummyFileObject)
    expect(file.clientSize()).to.equal(dummyFileObject.size)
  })

  /**
   * testing tmpPath method expectations to make sure it returns
   * uploaded file tmp path before moving it somewhere
   */
  it('should return temporary path for a file', function () {
    var file = new File(dummyFileObject)
    expect(file.tmpPath()).to.equal(dummyFileObject.path)
  })

  /**
   * testing move method expectations to make it moves
   * file to a given directory
   */
  it('should move file to a given path', function (done) {
    var server = http.createServer(function (req, res) {
      var request = new Request(req)
      var form = new formidable.IncomingForm()

      form.parse(req, function (err, fields, files) {
        if (err) {
          return res.end()
        }

        request.uploadedFiles = files
        let file = request.file('profile')
        co(function *() {
          yield file.move(path.join(__dirname, './uploads'))
        }).then(function (success) {
          res.writeHead(200, {
            'Content-type': 'application/json'
          })
          res.end(JSON.stringify({moved: file.moved(), errors: file.errors()}))
        }).catch(function () {
          res.end()
        })
      })
    })

    supertest(server)
      .post('/profile')
      .attach('profile', path.join(__dirname, './helpers/npm-logo.svg'))
      .end(function (err, res) {
        if (err) throw (err)
        expect(res.body).to.be.an('object')
        expect(res.body.moved).to.equal(true)
        expect(res.body.errors).to.equal(null)
        done()
      })
  })

  /**
   * making sure uploadName returns the uploaded file name
   */
  it('should move file to a given path with different upload name', function (done) {
    let uploadName = new Date().getTime()
    uploadName = `${uploadName}.svg`

    var server = http.createServer(function (req, res) {
      var request = new Request(req)
      var form = new formidable.IncomingForm()

      form.parse(req, function (err, fields, files) {
        if (err) {
          res.end()
        }

        request.uploadedFiles = files
        let file = request.file('profile')
        co(function *() {
          yield file.move(path.join(__dirname, './uploads'), uploadName)
        }).then(function (success) {
          res.writeHead(200, {
            'Content-type': 'application/json'
          })
          res.end(JSON.stringify({file: file.uploadName()}))
        }).catch(function () {
          res.end()
        })
      })
    })

    supertest(server)
      .post('/profile')
      .attach('profile', path.join(__dirname, './helpers/npm-logo.svg'))
      .end(function (err, res) {
        if (err) throw (err)
        expect(res.body.file).to.equal(uploadName)
        done()
      })
  })

  /**
   * making sure errors method returns all errors occurred while uploading
   * file to the server.
   */
  it('should return an error when unable to move file to a given path', function (done) {
    dummyFileObject.path = 'abc'
    var file = new File(dummyFileObject)

    co(function *() {
      return yield file.move(path.join(__dirname, './uploads'))
    }).then(function (success) {
      expect(file.moved()).to.equal(false)
      expect(file.errors().code).to.equal('ENOENT')

      done()
    }).catch(done)
  })
})
