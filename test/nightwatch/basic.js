const adonisDispatcher = require('../../index')
const Router = adonisDispatcher.Router
const Server = adonisDispatcher.Server

Router.get('/', function * (request, response) {
  return 'hello world'
})
Server.start(3000)

module.exports = {
  'Basic server hello world': function (browser) {
    browser
      .url('http://localhost:3000/')
      .assert.containsText('body', 'hello world')
      .end(function () {
        Server.stop()
      })
  }
}
