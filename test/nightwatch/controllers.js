
const adonisDispatcher = require("../../index")
const path = require('path')
const Router = adonisDispatcher.Router
const Server = adonisDispatcher.Server
const Namespace = adonisDispatcher.Namespace


Namespace.identifier("controllers").namespace("App/Http/Controllers").register(path.join(__dirname,'./controllers'));
Router.get("/home","HomeController.index");

Server.start(3000);

module.exports = {
  'Hello world using controllers' : function (browser) {
    browser
      .url('http://localhost:3000/home')
      .assert.containsText('body','hello world from controller')
      .end(Server.stop)
      .end(function(){
        Server.stop()
      })
  }
};
