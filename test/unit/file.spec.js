"use strict"

const File = require("../../src/File/index");
const path = require("path")
const co = require("co")
const chai = require('chai')
const expect = chai.expect

let dummyFileObject = {
  size: 235,
  path: '/var/folders/mb/281v60z50ml4tw4qk9x25hr40000gn/T/upload_762fa0b6befe47e2d07968764394646c',
  name: 'npm-logo.svg',
  type: 'image/svg+xml',
  mtime: "Mon Aug 17 2015 13:14:21 GMT+0530 (IST)",
  length: undefined,
  filename: undefined,
  mime: undefined
}

describe("Files", function() {

  it("should return mimtype for a given file",function(){
    var file = new File(dummyFileObject);
    expect(file.mimeType()).to.equal(dummyFileObject.type)
  });


  it("should return extension for a given file",function(){
    var file = new File(dummyFileObject);
    expect(file.extension()).to.equal('svg')
  });


  it("should return client name for the uploaded file",function(){
    var file = new File(dummyFileObject);
    expect(file.clientName()).to.equal(dummyFileObject.name)
  });


  it("should return size for a given file",function(){
    var file = new File(dummyFileObject);
    expect(file.clientSize()).to.equal(dummyFileObject.size)
  });

  it("should return temporary path for a file",function(){
    var file = new File(dummyFileObject);
    expect(file.tmpPath()).to.equal(dummyFileObject.path)
  });

  it("should move file to a given path",function(done){
    var file = new File(dummyFileObject);

    co(function *(){
      return yield file.move(path.join(__dirname,"./uploads"))
    }).then(function(success){
      expect(file.moved()).to.equal(true)
      expect(file.errors()).to.equal(null)
      done();
    }).catch(done)

  });


  it("should move file to a given path with different upload name",function(done){
    var file = new File(dummyFileObject);
    let uploadName = new Date().getTime();
    uploadName = `${uploadName}.svg`

    co(function *(){
      return yield file.move(path.join(__dirname,"./uploads"),uploadName)
    }).then(function(success){

      expect(file.moved()).to.equal(true)
      expect(file.errors()).to.equal(null)

      done();
    }).catch(done)

  });

  it("should return an error when unable to move file to a given path",function(done){
    dummyFileObject.path = 'abc'
    var file = new File(dummyFileObject);

    co(function *(){
      return yield file.move(path.join(__dirname,"./uploads"))
    }).then(function(success){

      expect(file.moved()).to.equal(false)
      expect(file.errors().code).to.equal('ENOENT')

      done();
    }).catch(done)

  });


});
