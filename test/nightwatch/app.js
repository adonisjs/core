const adonisDispatcher = require('../../index')
const chai = require('chai')
const expect = chai.expect
const path = require('path')
const Router = adonisDispatcher.Router
const Server = adonisDispatcher.Server
const Namespace = adonisDispatcher.Namespace
const View = adonisDispatcher.View
const Env = adonisDispatcher.Env

Env.load(path.join(__dirname, '.env'))

View.configure(path.join(__dirname, './resources/views'))

Namespace.identifier('controllers').namespace('App/Http/Controllers').register(path.join(__dirname, './controllers'))
Namespace.identifier('services').namespace('App/Http/Services').register(path.join(__dirname, './services'))

Router.get('/app', 'AppController.show')

Server.start(Env.get('APP_PORT'))

module.exports = {
  'Serving entire application': function (browser) {
    browser.url('http://localhost:3000/app')

    browser.elements('css selector', 'ul li', function (element) {
      browser.elementIdText(element.value[0].ELEMENT, function (result) {
        expect(result.value).to.equal('virk')
      })
    })

    browser.end(function () {
      Server.stop()
    })
  }
}
