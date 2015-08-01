  "use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-http-dispatcher
 * @description - Integeration tests to figure out how stuff looks under same roof.
 */


let Dispatcher = require("../../index"),
    api        = require("hippie"),
    Routes     = Dispatcher.Router,
    Server     = Dispatcher.Server;


let usersToReturn = [
  {
    username: 'foo',
    age     : 22
  },
  {
    username : 'bar',
    age     : 25
  }
];

let getUsers = function(timeout){
  return new Promise(function(resolve,reject){
    if(!timeout){
      resolve(usersToReturn);
    }
  });
}

describe("Basic Http Server",function(){

  afterEach(function(){
    Server.stop();
  })

  it("should spyn a server on given port and respond to a registered route",function(done){

    Routes.get("/user",function *(request,response){
      let users = yield getUsers();
      if(users){
        response.status(200).send(users);
      }
    });

    Server.start(3000);

    api()
      .base('http://localhost:3000')
      .get('/user')
      .expectStatus(200)
      .end(function(err,res,body){
        if(err) done(err)
        done();
      })

  });

});