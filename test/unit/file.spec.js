'use strict'

/**
 * adonis-framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
 */

const File = require('../../src/File')
const chai = require('chai')
const path = require('path')
const fs = require('fs')
const expect = chai.expect

require('co-mocha')

describe('File', function () {
  beforeEach(function () {
    fs.closeSync(fs.openSync(path.join(__dirname, './uploads/tmp'), 'w'))
    this.file = new File({
      name: 'npm-logo.svg',
      path: path.join(__dirname, './uploads/npm-logo.svg'),
      type: 'svg',
      size: '233'
    })
  })

  after(function (done) {
    fs.rename(path.join(__dirname, '/public/logo.svg'), path.join(__dirname, '/uploads/npm-logo.svg'), function (err) {
      if (err) {
        done(err)
      } else {
        done()
      }
    })
  })

  it('should throw an error when unable to move file', function * () {
    yield this.file.move('/etc/boom')
    expect(this.file.moved()).to.equal(false)
    expect(this.file.errors().message).to.match(/EACCES: permission denied/)
  })

  it('should move file to a given path with its original name', function * () {
    yield this.file.move(path.join(__dirname, './public'))
    expect(this.file.moved()).to.equal(true)
  })

  it('should move file to a given path with new name', function * () {
    this.file.file.path = path.join(__dirname, './public/npm-logo.svg')
    yield this.file.move(path.join(__dirname, './public'), 'logo.svg')
    expect(this.file.moved()).to.equal(true)
    expect(this.file.uploadName()).to.equal('logo.svg')
    expect(this.file.uploadPath()).to.equal(path.join(__dirname, './public/logo.svg'))
  })

  it('should be able to delete before being moved', function * () {
    this.file.file.path = path.join(__dirname, './uploads/tmp')
    expect(fs.existsSync(this.file.tmpPath())).to.equal(true)
    yield this.file.delete()
    expect(fs.existsSync(this.file.tmpPath())).to.equal(false)
    expect(this.file.exists()).to.equal(false)
  })

  it('should be able to delete after being moved', function * () {
    this.file.file.path = path.join(__dirname, './uploads/tmp')
    expect(fs.existsSync(this.file.tmpPath())).to.equal(true)
    yield this.file.move(path.join(__dirname, './public'), 'tmp')
    expect(fs.existsSync(this.file.tmpPath())).to.equal(false)
    expect(fs.existsSync(this.file.uploadPath())).to.equal(true)
    yield this.file.delete()
    expect(fs.existsSync(this.file.uploadPath())).to.equal(false)
    expect(this.file.exists()).to.equal(false)
  })

  it('should throw an error if try to delete twice', function * () {
    this.file.file.path = path.join(__dirname, './uploads/tmp')
    expect(fs.existsSync(this.file.tmpPath())).to.equal(true)
    yield this.file.delete()
    let error
    try {
      yield this.file.delete()
    } catch (e) {
      error = e
    }
    expect(error).to.be.an.instanceOf(Object)
    expect(error.message).to.equal('E_FILE_DELETED: The file has already been deleted')
  })

  it('should throw an error if try to move after deleting', function * () {
    this.file.file.path = path.join(__dirname, './uploads/tmp')
    expect(fs.existsSync(this.file.tmpPath())).to.equal(true)
    yield this.file.delete()
    let error
    try {
      yield this.file.move(path.join(__dirname, './uploads/tmp2'))
    } catch (e) {
      error = e
    }
    expect(error).to.be.an.instanceOf(Object)
    expect(error.message).to.equal('E_FILE_DELETED: The file has already been deleted')
  })

  it('should return file mime type', function * () {
    expect(this.file.mimeType()).to.equal('svg')
  })

  it('should return file extension', function * () {
    expect(this.file.extension()).to.equal('svg')
  })

  it('should return file size', function * () {
    expect(this.file.clientSize()).to.equal('233')
  })

  it('should tell whether file exists on tmp path or not', function * () {
    expect(this.file.exists()).to.equal(true)
  })
})
