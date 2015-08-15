'use strict';

class AppController{

  constructor(AppService){
    this.app = AppService
  }

  static get inject(){
    return ["App/Http/Services/AppService"]
  }

  *show(request,response){
    let users = yield this.app.listUsers()
    response.view("users.html",{users})
  }

}


module.exports = AppController