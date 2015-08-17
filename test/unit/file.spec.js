"use strict";

require('jasmine-expect');
const File = require("../../src/File/index");
const path = require("path")
const co = require("co")

let dummyFileObject = { 
  size: 235,
  path: '/var/folders/gc/lwgzcqtd60vf6z6n1j3trwp40000gn/T/upload_59b36c74cda4c429a01833ab7d6ef547',
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
    expect(file.mimeType()).toBe(dummyFileObject.type)
  });


  it("should return extension for a given file",function(){
    var file = new File(dummyFileObject);
    expect(file.extension()).toBe('svg')
  });


  it("should return client name for the uploaded file",function(){
    var file = new File(dummyFileObject);
    expect(file.clientName()).toBe(dummyFileObject.name)
  });


  it("should return size for a given file",function(){
    var file = new File(dummyFileObject);
    expect(file.clientSize()).toBe(dummyFileObject.size)
  });

  it("should return temporary path for a file",function(){
    var file = new File(dummyFileObject);
    expect(file.tmpPath()).toBe(dummyFileObject.path)
  });

  it("should move file to a given path",function(done){
    var file = new File(dummyFileObject);

    co(function *(){
      return yield file.move(path.join(__dirname,"./uploads"))
    }).then(function(success){

      expect(file.moved()).toBe(true)
      expect(file.errors()).toBe(null)

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

      expect(file.moved()).toBe(true)
      expect(file.errors()).toBe(null)

      done();
    }).catch(done)

  });

  it("should return an error when unable to move file to a given path",function(done){
    dummyFileObject.path = 'abc'
    var file = new File(dummyFileObject);

    co(function *(){
      return yield file.move(path.join(__dirname,"./uploads"))
    }).then(function(success){

      expect(file.moved()).toBe(false)
      expect(file.errors().code).toBe('ENOENT')

      done();
    }).catch(done)

  });


});
