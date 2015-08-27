'use strict'

const Static = require('../../src/Static')
const chai = require('chai')
const expect = chai.expect
const path = require('path')
const supertest = require("supertest")
const http = require("http")

describe('Static',function(){

  it('should return 404 , when there is not static server booted',function(done){
    var server = http.createServer(function(req, res) {
      Static.serve(req,res)
    });
    supertest(server)
      .get("/hello.txt")
      .expect(404)
      .end(function(err, res) {
        if (err) throw (err);
        done();
      });
  })

  it('should register a valid directory as static directory for serving assets',function(done){
    Static.public('/public',path.join(__dirname,'./static'))
    var server = http.createServer(function(req, res) {
      Static.serve(req,res)
    });
    supertest(server)
      .get("/hello.txt")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text.trim()).to.equal('Hello')
        done();
      });
  })

  it('should tell whether request is for static resource or not',function(done){
    Static.public('public',path.join(__dirname,'./static'))
    var server = http.createServer(function(req, res) {
      const isStatic = Static.isStatic(req.url) ? 'yes' : 'no'
      res.end(isStatic)
    });
    supertest(server)
      .get("/public/hello.txt")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text.trim()).to.equal('yes')
        done();
      });
  })

  it('should remove public namespace from a given url',function(done){
    Static.public('public',path.join(__dirname,'./static'))
    var server = http.createServer(function(req, res) {
      const reqUrl = Static.removePublicNamespace(req.url);
      res.end(reqUrl)
    });
    supertest(server)
      .get("/public/hello.txt")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text.trim()).to.equal('/hello.txt')
        done();
      });
  })

  it('should return 404 when favicon path is not registered',function(done){
    var server = http.createServer(function(req, res) {
      Static.serveFavicon(req,res,function(err){
        res.end()
      })
    });
    supertest(server)
      .get("/favicon.ico")
      .expect(404)
      .end(function(err, res) {
        if (err) done(err);
        done();
      });
  })

  it('should serve favicon from a given directory',function(done){
    Static.favicon(path.join(__dirname,'./static/favicon.ico'))
    var server = http.createServer(function(req, res) {
      Static.serveFavicon(req,res,function(err){
        res.end()
      })
    });
    supertest(server)
      .get("/favicon.ico")
      .expect(200)
      .end(function(err, res) {
        if (err) done(err);
        expect(res.type).to.equal('image/x-icon')
        done();
      });
  })

})
