"use strict";
require('jasmine-expect');

let Request = require("../../src/Request/index"),
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
      var name = request.get("name");
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify(name));
    });

    supertest(server)
      .get("/user?name=virk&age=26")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("name");
        expect(res.body.name).toBe("virk");
        expect(res.body.age).toBe(undefined);
        done();
      });

  });


  it("should return null for keys requested by get method but does not exists as request query string", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var name = request.get("name", "age");
      res.writeHead(200, {
        "Content-type": "application/json"
      });
      res.end(JSON.stringify(name));
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
        var postBody = request.post("username", "age");
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify(postBody));
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
        expect(res.body).toHaveMember("email");
        expect(res.body.age).toBe(undefined);
        expect(res.body.username).toBe(undefined);
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
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify(files));
      });
    });

    supertest(server)
      .post("/user?age=22")
      .attach("profile", path.join(__dirname, "./helpers/npm-logo.svg"))
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("profile");
        expect(res.body.profile).toHaveMember("name");
        expect(res.body.profile.name).toBe("npm-logo.svg");
        done();
      });
  });



  it("should return only requested uploaded files", function(done) {
    var server = http.createServer(function(req, res) {
      var request = new Request(req);
      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {
        request.uploadedFiles = files;
        var files = request.files("profile");
        res.writeHead(200, {
          "Content-type": "application/json"
        });
        res.end(JSON.stringify(files));
      });
    });

    supertest(server)
      .post("/user?age=22")
      .attach("profile", path.join(__dirname, "./helpers/npm-logo.svg"))
      .attach("logo", path.join(__dirname, "./helpers/npm-logo.svg"))
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.body).toBeNonEmptyObject();
        expect(res.body).toHaveMember("profile");
        expect(res.body.profile).toHaveMember("name");
        expect(res.body.profile.name).toBe("npm-logo.svg");
        expect(res.body.logo).toBe(undefined);
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

});