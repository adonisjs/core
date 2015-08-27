"use strict";


const Request = require("../../src/Request/index")
const RequestHelpers = require("../../src/Request/helpers")
const File = require("../../src/File")
const supertest = require("supertest")
const formidable = require("formidable")
const http = require("http")
const is = require("type-is")
const path = require("path")
const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-string'))

describe("Request", function() {

  it("should return all get values for a given request", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var queryString = request.get();
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify(queryString));
    });

    supertest(server)
      .get("/user?name=virk")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property("name");
        expect(res.body.name).to.equal("virk");
        done();
      });
  });


  it("should return only requested get fields for a given request", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var name = request.input("name");
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify({name:name}));
    });

    supertest(server)
      .get("/user?name=virk&age=26")
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property("name");
        expect(res.body.name).to.equal("virk");
        expect(res.body.age).to.equal(undefined);
        done();
      });

  });


  it("should return default value for field missing inside query string", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var age = request.input("age",22);
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify({age}));
    });

    supertest(server)
      .get("/user?name=virk")
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body).to.be.an('object');
        expect(res.body.age).to.equal(22);
        done();
      });

  });


  it("should return null for key requested by input method but does not exists as request query string", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var age = request.input("age");
      var name = request.input("name");
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify({age:age,name:name}));
    });

    supertest(server)
      .get("/user?name=virk")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property("name");
        expect(res.body.name).to.equal("virk");
        expect(res.body).to.have.property("age");
        expect(res.body.age).to.equal(null);
        done();
      });

  });



  it("should return all post values on request", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {
        request.body = fields;
        var postBody = request.post();
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify(postBody));
      });

    });

    supertest(server)
      .post("/user")
      .send({
        username: "dummy",
        email: "dummy@example.com"
      })
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property("username");
        expect(res.body).to.have.property("email");
        done();
      });
  });


  it("should return only requested post values on request", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {
        request.body = fields;
        var postBody = request.post("username");
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify({username:postBody}));
      });
    });

    supertest(server)
      .post("/user")
      .send({
        username: "dummy",
        email: "dummy@example.com"
      })
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property("username");
        expect(res.body.email).to.equal(undefined);
        done();
      });
  });


  it("should return null of keys request by post method and does not exists on request body", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {
        request.body = fields;
        var username = request.input("username");
        var age = request.input("age");
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify({username,age}));
      });
    });

    supertest(server)
      .post("/user")
      .send({
        username: "dummy"
      })
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property("username");
        expect(res.body).to.have.property("age");
        expect(res.body.age).to.equal(null);
        done();
      });
  });



  it("should return all values sent to request as querystring or post body", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {
        request.body = fields;
        var all = request.all();
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify(all));
      });
    });

    supertest(server)
      .post("/user?age=22")
      .send({
        username: "dummy"
      })
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property("username");
        expect(res.body).to.have.property("age");
        expect(res.body.age).to.equal("22");
        done();
      });
  });



  it("should return all values sent to request as querystring or post body except defined keys", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {
        request.body = fields;
        var all = request.except("email");
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify(all));
      });
    });

    supertest(server)
      .post("/user?age=22")
      .send({
        username: "dummy",
        email: "dummy@example.com"
      })
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property("username");
        expect(res.body).to.have.property("age");
        expect(res.body.age).to.equal("22");
        expect(res.body.email).to.equal(undefined);
        done();
      });
  });


  it("should return only defined values from request body or query string", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {
        request.body = fields;
        var all = request.only("email");
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify({email:all}));
      });
    });

    supertest(server)
      .post("/user?age=22")
      .send({
        username: "dummy",
        email: "dummy@example.com"
      })
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property("email");
        expect(res.body.age).to.equal(undefined);
        expect(res.body.username).to.equal(undefined);
        done();
      });
  });


  it("should return uploaded files as an instance of File object", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {
        request.uploadedFiles = files;
        var profile = request.file("profile");
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify({name:profile.clientName(),ext:profile.extension()}));
      });
    });

    supertest(server)
      .post("/user")
      .attach("profile", path.join(__dirname, "./helpers/npm-logo.svg"))
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal("npm-logo.svg");
        expect(res.body.ext).to.equal("svg");
        done();
      });
  });


  it("should return false on calling exists when uploaded file does not exists", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {
        request.uploadedFiles = files;
        var doc = request.file("doc");
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify({exists:doc.exists()}));
      });
    });

    supertest(server)
      .post("/user")
      .attach("profile", path.join(__dirname, "./helpers/npm-logo.svg"))
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body.exists).to.equal(false);
        done();
      });
  });



  it("should return all uploaded files", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {
        request.uploadedFiles = files;
        var files = request.files();
        let uploadedFiles = {}

        Object.keys(files).forEach(function(element){
          let file = files[element]
          uploadedFiles[element] = {ext:file.extension()}
        });

        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify(uploadedFiles));
      });
    });

    supertest(server)
      .post("/user?age=22")
      .attach("profile", path.join(__dirname, "./helpers/npm-logo.svg"))
      .attach("logo", path.join(__dirname, "./helpers/npm-logo.svg"))
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body.profile.ext).to.equal('svg');
        expect(res.body.logo.ext).to.equal('svg');
        done();
      });
  });



  it("should return request ip address", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var ip = request.ip();
      res.writeHead(200, {
        "Content-type": "text/plain"
      });
      res.end(ip);
    });

    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text).to.endsWith("127.0.0.1");
        done();
      });
  });



  it("should return request method", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var method = request.method();
      res.writeHead(200, {
        "Content-type": "text/plain"
      });
      res.end(method);
    });

    supertest(server)
      .post("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text).to.equal("POST");
        done();
      });
  });

  it("should parse and return request headers", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var headers = request.headers();
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify(headers));
    });

    supertest(server)
      .post("/")
      .set("token", 123)
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property("token");
        expect(res.body.token).to.equal("123");
        done();
      });
  });

  it("should return request header for a given key", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var token = request.header("token");
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(token);
    });

    supertest(server)
      .post("/")
      .set("token", 123)
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text).to.equal("123");
        done();
      });
  });


  it("should return defaultValue for a given key if it does not exists on header", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var token = request.header("token","sometoken");
      res.end(token);
    });

    supertest(server)
      .post("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text).to.equal("sometoken");
        done();
      });
  });

  it('should return path for a given request', function (done){
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var reqPath = request.path();
      res.end(reqPath);
    });

    supertest(server)
      .post("/special")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text).to.equal("/special");
        done();
      });
  })


  it('should not return query string with path for a given request', function (done){
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var reqPath = request.path();
      res.end(reqPath);
    });

    supertest(server)
      .post("/special?foo=bar")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text).to.equal("/special");
        done();
      });
  })


  it('should return true for ajax requests when request has X-Requested-With header', function (done){
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var isAjax = request.ajax() ? 'yes' : 'no'
      res.end(isAjax);
    });

    supertest(server)
      .post("/ajax")
      .set('X-Requested-With','XMLHttpRequest')
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text).to.equal("yes");
        done();
      });
  })

  it('should return true for pajax requests when request has x-pjax header', function (done){
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var isPjax = request.pjax() ? 'yes' : 'no'
      res.end(isPjax);
    });

    supertest(server)
      .post("/pajax")
      .set('x-pjax',true)
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text).to.equal("yes");
        done();
      });
  })


  it('should return empty object when there are no cookies attached with request', function (done){
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var cookies = request.cookies()
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify({cookies}));
    });

    supertest(server)
      .post("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body.cookies).to.be.an("object");
        expect(res.body.cookies).deep.equal({});
        done();
      });
  })


  it('should parse cookies attached with request', function (done){
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var cookies = request.cookies()
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify({cookies}));
    });

    supertest(server)
      .post("/")
      .set('Cookie',['token=12345'])
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body.cookies).to.be.an("object");
        expect(res.body.cookies).to.have.property('token');
        expect(res.body.cookies.token).to.equal('12345');
        done();
      });
  })


  it('should return cookie value for a given key', function (done){
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var token = request.cookie('token')
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify({token}));
    });

    supertest(server)
      .post("/")
      .set('Cookie',['token=12345'])
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body.token).to.equal('12345');
        done();
      });
  })


  it('should return default value for a given key if cookie value for that key is missing', function (done){
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var token = request.cookie('token','33')
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify({token}));
    });

    supertest(server)
      .post("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body.token).to.equal('33');
        done();
      });
  })


  it("should return best match for accept header within given options", function(done) {

    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var accepts = request.accepts("json","html");
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify({accepts:accepts}));
    });

    supertest(server)
      .get("/")
      .set("Accept", "application/json")
      .end(function(err, res) {
        if (err) done(err);
        expect(res.body.accepts).to.equal("json");
        done();
      });
  });


  it("should return best match for accept header without any options", function(done) {

    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var accepts = request.accepts();
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify({accepts:accepts}));
    });

    supertest(server)
      .get("/")
      .set("Accept", "application/json")
      .end(function(err, res) {
        if (err) done(err);
        expect(res.body.accepts).to.deep.equal(["application/json"]);
        done();
      });
  });



  it("should tell whether request accepts particular content-type or not", function(done) {

    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var type = request.is("json");

      res.writeHead(200, {
        "Content-type": "text/plain"
      });
      res.end(type.toString());
    });

    supertest(server)
      .get("/")
      .type("application/json")
      .end(function(err, res) {
        if (err) done(err);
        expect(res.text).to.equal("true");
        done();
      });
  });


  it("should tell whether request accepts particular content-type or not when multiple types have been checked", function(done) {

    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var type = request.is("json","html");

      res.writeHead(200, {
        "Content-type": "text/plain"
      });
      res.end(type.toString());
    });

    supertest(server)
      .get("/")
      .type("application/json")
      .end(function(err, res) {
        if (err) done(err);
        expect(res.text).to.equal("true");
        done();
      });
  });

  it("should return request params using params method", function(done) {

    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      request.request.params = {id:1};
      var id = request.params().id;
      res.writeHead(200, {
        "Content-type": "text/plain"
      });
      res.end(id.toString());
    });

    supertest(server)
      .get("/1")
      .end(function(err, res) {
        if (err) done(err);
        expect(res.text).to.equal("1");
        done();
      });
  });


  it("should return selected request param using param method", function(done) {

    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      request.request.params = {id:1};
      var id = request.param("id");
      res.writeHead(200, {
        "Content-type": "text/plain"
      });
      res.end(id.toString());
    });

    supertest(server)
      .get("/1")
      .end(function(err, res) {
        if (err) done(err);
        expect(res.text).to.equal("1");
        done();
      });
  });


  it("should return default value for param if it does not exists under params object", function(done) {

    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var id = request.param("id",2);
      res.writeHead(200, {
        "Content-type": "text/plain"
      });
      res.end(id.toString());
    });

    supertest(server)
      .get("/1")
      .end(function(err, res) {
        if (err) done(err);
        expect(res.text).to.equal("2");
        done();
      });
  });

  describe("Request Helpers",function(){

    it('should return selected values from an object', function(){
      const user = {username:'foo',age:22}
      const filtered = RequestHelpers.return_requested_keys_from_object(user,{0:'username'})
      expect(filtered.age).to.equal(undefined)
      expect(filtered.username).to.equal(user.username)
    });

    it('should return null for request key value if original value does not exists', function(){
      const user = {username:'foo',age:22}
      const filtered = RequestHelpers.return_requested_keys_from_object(user,{0:'username',1:'email'})
      expect(filtered.email).to.equal(null)
    });

    it('should return original object back if there are no keys to be filtered', function(){
      const user = {username:'foo',age:22}
      const filtered = RequestHelpers.return_requested_keys_from_object(user)
      expect(filtered).to.deep.equal(user)
    });

    it('should remove request keys from an object and only return remaining values', function(){
      const user = {username:'foo',age:22}
      const filtered = RequestHelpers.remove_requested_keys_from_object(user,['age'])
      expect(filtered.age).to.equal(undefined)
      expect(filtered.username).to.equal(user.username)
    });

    it('should return original object back if there are no keys to be removed', function(){
      const user = {username:'foo',age:22}
      const filtered = RequestHelpers.remove_requested_keys_from_object(user)
      expect(filtered).to.deep.equal(user)
    });


  });

});
