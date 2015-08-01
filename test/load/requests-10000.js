"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-http-dispatcher
 * @description - Loading testing the server
 */

const loadtest = require('loadtest');
const options = {
  url: 'http://localhost:3000',
  maxRequests: 10000,
  statusCallback: statusCallback
};

function statusCallback(result) {
  // console.log('Current Status: ' + require('util').inspect(result));
}

const Dispatcher = require("../../index"),
  Server = Dispatcher.Server,
  Router = Dispatcher.Router


Router.get("/", function*(request, response) {
  response.send("passing>>>>");
});

Server.start(3000);

console.log("Load testing with 10,000 requests .....")
loadtest.loadTest(options, function(error, result) {
  if (error) {
    return console.error('Got an error: %s', error);
  }
  console.log(result);
  console.log('Tests ran successfully');
  Server.stop();
});
