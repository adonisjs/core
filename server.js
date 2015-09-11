"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-framework
 * @description - Integeration tests to figure out how stuff looks under same roof.
 */


const Dispatcher = require("./index")
const api = require("hippie")
const path = require("path")
const chai = require('chai')
const expect = chai.expect
const Routes = Dispatcher.Route
const HttpException = Dispatcher.HttpException
const Env = Dispatcher.Env
const Request = Dispatcher.Request
const Logger = Dispatcher.Logger
const View = Dispatcher.View
const Response = Dispatcher.Response
const Helpers = Dispatcher.Helpers
const Namespace = Dispatcher.Namespace
const Middlewares = Dispatcher.Middlewares
const Static = Dispatcher.Static
const cluster = require('cluster')
const _ = require('lodash')
const Ioc = require('adonis-fold').Ioc
let server = null


Helpers.load(path.join(__dirname,'./test/integration/package.json'))
let env = new Env(Helpers)
let namespace = new Namespace(env,Helpers)

let view = new View(Helpers,env)
let response = new Response(view)
server = new Dispatcher.Server(Routes,Request,response,Logger)

namespace
.autoload()
.then(function () {

  Routes.get("/home", "HomeController.store");
  server.start(4000);

})
.catch(function (err) {
  console.log(err.stack)
})
