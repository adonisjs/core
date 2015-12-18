'use strict'


/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const File = require('../../src/File')
const chai = require('chai')
const path = require('path')
const fs = require('fs')
const expect = chai.expect

require('co-mocha')

const file = new File({
  name : 'npm-logo.svg',
  path : path.join(__dirname,'./uploads/npm-logo.svg'),
  type : 'svg',
  size : '233'
})

describe('File', function() {

  after(function (done) {
    fs.rename(__dirname+'/public/logo.svg',__dirname+'/uploads/npm-logo.svg',function (err) {
      if(err) {
        done(err)
      }else{
        done()
      }
    })
  })

  it('should throw an error when unable to move file', function * () {
    yield file.move('./boom')
    expect(file.moved()).to.equal(false)
    expect(file.errors().message).to.match(/no such file or directory/)
  })

  it('should move file to a given path with its original name', function * () {
    yield file.move(path.join(__dirname,'./public'))
    expect(file.moved()).to.equal(true)
  })

  it('should move file to a given path with new name', function * () {
    file.file.path = path.join(__dirname,'./public/npm-logo.svg')
    yield file.move(path.join(__dirname,'./public'),'logo.svg')
    expect(file.moved()).to.equal(true)
    expect(file.uploadName()).to.equal('logo.svg')
    expect(file.uploadPath()).to.equal(path.join(__dirname,'./public/logo.svg'))
  })

  it('should return file mime type', function * () {
    expect(file.mimeType()).to.equal('svg')
  })

  it('should return file extension', function * () {
    expect(file.extension()).to.equal('svg')
  })

  it('should return file size', function * () {
    expect(file.clientSize()).to.equal('233')
  })

  it('should tell whether file exists on tmp path or not', function * () {
    expect(file.exists()).to.equal(true)
  })

});
