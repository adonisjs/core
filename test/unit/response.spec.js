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
const chai = require('chai')
const path = require('path')
const co = require('co')
const http = require('http')
const supertest = require("supertest")
const expect = chai.expect

let Helpers = {
  viewsPath: function(){
    return path.join(__dirname,'./views')
  }
}

describe('Response', function () {
  it('should extend node-res prototype', function (done) {

    let view = new View(Helpers)
    let MakeResponse = new Response(view)

    let response = new MakeResponse({}, {})
    let proto = response.__proto__

    expect(proto).to.be.an('object')
    expect(proto).to.have.property('header')
    expect(proto).to.have.property('end')
    expect(proto).to.have.property('send')
    expect(proto).to.have.property('view')
    done()
  })

  it("should compile a view using View class and return compiled template", function(done) {

    let view = new View(Helpers)
    let MakeResponse = new Response(view)

      const name = 'virk'
      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        co (function * () {
          return yield response.view('index.html',{name})
        }).then(function(view){
          response.send(view).end()
        }).catch(function(error){
          response.send(error.message).end()
        })
      });

      supertest(server)
        .post("/")
        .set("token", 123)
        .end(function(err, res) {
          if (err) throw (err);
          expect(res.text.trim()).to.equal(name)
          done();
        });
    });

})
