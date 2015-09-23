const adonisDispatcher = require('../../index')
const path = require('path')
const Router = adonisDispatcher.Router
const View = adonisDispatcher.View
const Server = adonisDispatcher.Server

View.configure(path.join(__dirname, './resources/views'))

Router.get('/view', function * (request, response) {
  response.view('index.html')
})

Server.start(3000)

module.exports = {
  'hello world using views': function (browser) {
    browser
      .url('http://localhost:3000/view')
      .assert.containsText('h2', 'Welcome to adonis')
      .end(function () {
        Server.stop()
      })
  }
}
