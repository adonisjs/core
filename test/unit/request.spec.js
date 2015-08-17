"use strict";
require('jasmine-expect');

let Request = require("../../src/Request/index"),
  File = require("../../src/File"),
  supertest = require("supertest"),
  formidable = require("formidable"),
  http = require("http"),
  is = require("type-is"),
  path = require("path");


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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("name");
        expect(res.body.name).toBe("virk");
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("name");
        expect(res.body.name).toBe("virk");
        expect(res.body.age).toBe(undefined);
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body.age).toBe(22);
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("name");
        expect(res.body.name).toBe("virk");
        expect(res.body).toHaveMember("age");
        expect(res.body.age).toBe(null);
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("username");
        expect(res.body).toHaveMember("email");
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("username");
        expect(res.body.email).toBe(undefined);
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("username");
        expect(res.body).toHaveMember("age");
        expect(res.body.age).toBe(null);
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("username");
        expect(res.body).toHaveMember("age");
        expect(res.body.age).toBe("22");
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("username");
        expect(res.body).toHaveMember("age");
        expect(res.body.age).toBe("22");
        expect(res.body.email).toBe(undefined);
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("email");
        expect(res.body.age).toBe(undefined);
        expect(res.body.username).toBe(undefined);
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body.name).toBe("npm-logo.svg");
        expect(res.body.ext).toBe("svg");
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body.profile.ext).toBe('svg');
        expect(res.body.logo.ext).toBe('svg');
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
        expect(res.text).toEndWith("127.0.0.1");
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
        expect(res.text).toBe("POST");
        done();
      });
  });



  it("should return request headers", function(done) {
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
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("token");
        expect(res.body.token).toBe("123");
        done();
      });
  });



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
        expect(res.body.accepts).toBe("json");
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
        expect(res.body.accepts).toEqual(["application/json"]);
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
        expect(res.text).toBe("true");
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
        expect(res.text).toBe("true");
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
        expect(res.text).toBe("1");
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
        expect(res.text).toBe("1");
        done();
      });
  });

});