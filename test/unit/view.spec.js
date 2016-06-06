'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const View = require('../../src/View')
const Route = require('../../src/Route')
const chai = require('chai')
const path = require('path')
const expect = chai.expect
require('co-mocha')

const Helpers = {
  viewsPath: function () {
    return path.join(__dirname,'./app/views')
  }
}
const Config = {
  get: function () {
    return true
  }
}

describe('View',function () {

  before(function () {
    this.view = new View(Helpers, Config, Route)
  })

  beforeEach(function () {
    Route.new()
  })

  it('should throw an error when unable to find view', function * () {
    try{
       yield this.view.make('foo.html')
       expect(true).to.be.false
    } catch(e) {
      expect(e.message).to.match(/template not found/)
    }
  })

  it('should make a view using it\'s path', function * () {
    const index = yield this.view.make('index.nunjucks')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make a view using it\'s path without .nunjucks extension', function * () {
    const index = yield this.view.make('index')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make a nested view using a /', function * () {
    const index = yield this.view.make('subviews/index')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make a nested view using a / and the extension', function * () {
    const index = yield this.view.make('subviews/index.nunjucks')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make a nested view using a .', function * () {
    const index = yield this.view.make('subviews.index')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make a nested view using a . and the extension', function * () {
    const index = yield this.view.make('subviews.index.nunjucks')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should include a view using a .', function * () {
    const index = yield this.view.make('include')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should include a view by going a directory back', function * () {
    const index = yield this.view.make('subviews.internal')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should extends a view using a .', function * () {
    const index = yield this.view.make('extends')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make use of route filter inside views', function * () {
    Route.get('/:id','ProfileController.show').as('profile')
    const profile = yield this.view.make('profile',{id:1})
    expect(profile.trim()).to.equal('/1')
  })

  it('should make use of action filter inside views', function * () {
    Route.get('/:id','ProfileController.show').as('profile')
    const profile = yield this.view.make('profileAction',{id:1})
    expect(profile.trim()).to.equal('/1')
  })

  // TODO: Change the codebase to handle this test
  it.skip('should throw an exception when make use of route filter and the route is not defined', function * () {

    Route.get('/:id', 'ProfileController.show').as('profiles')

    try {
      const profile = yield this.view.make('profile', { id: 1 })
      expect(true).to.be.false
    } catch (e) {
      expect(e.message).to.match(/The route profile has not been found/)
    }
  })

  it('should make an anchor link to a given route', function * () {
    Route.get('/:id','ProfileController.show').as('profile')
    const viewString = this.view.makeString('{{ linkTo("profile", "View Profile", {id: 1}) }}')
    expect(viewString.trim()).to.equal('<a href="/1" > View Profile </a>')
  })

  it('should make an anchor link with defined target to a given route', function * () {
    Route.get('/users','ProfileController.show').as('listUsers')
    const viewString = this.view.makeString('{{ linkTo("listUsers", "View Profile", {}, "_blank") }}')
    expect(viewString.trim()).to.equal('<a href="/users" target="_blank"> View Profile </a>')
  })

  it('should make an anchor link to a given action', function * () {
    Route.get('profile/:id','ProfileController.show')
    const viewString = this.view.makeString('{{ linkToAction("ProfileController.show", "View Profile", {id: 1}) }}')
    expect(viewString.trim()).to.equal('<a href="/profile/1" > View Profile </a>')
  })

  it('should make an anchor link with defined target to a given action', function * () {
    Route.get('profile/:id','ProfileController.show')
    const viewString = this.view.makeString('{{ linkToAction("ProfileController.show", "View Profile", {id: 1}, "_blank") }}')
    expect(viewString.trim()).to.equal('<a href="/profile/1" target="_blank"> View Profile </a>')
  })

  it('should return empty string when unable to find route action', function * () {
    const profile = this.view.makeString('{{ "ProfileController.show" | action({id:1}) }}',{id:1})
    expect(profile.trim()).to.equal('')
  })

  it('should stringify json', function * () {
    const jsonView = yield this.view.make('json',{profile:{name:"virk"}})
    expect(jsonView.trim()).to.equal(JSON.stringify({name:"virk"}, null, 2))
  })

  it('should be able to make use of yield keyword inside view', function * () {
    const profile = {
      get: function * () {
        return 'virk'
      }
    }
    const asyncView = yield this.view.make('async',{profile})
    expect(asyncView.trim()).to.equal('virk')
  })

  it('should return error thrown by yield method', function * () {
    const profile = {
      get: function * () {
        throw new Error('What you want?')
      }
    }
    try{
      yield this.view.make('async',{profile})
    }catch(e){
      expect(e.message).to.match(/What you/)
    }
  })

  it('should add a filter using filter method', function * () {
    this.view.filter('mycase', function (text) {
      return text.toUpperCase()
    })
    const view = yield this.view.make('filter')
    expect(view.trim()).to.equal('VIRK')
  })

  it('should add a global using global method', function * () {
    const time = new Date().getTime()
    this.view.global('time', function () {
      return time
    })
    const view = yield this.view.make('global')
    expect(view.trim()).to.equal(time.toString())
  })

  it('should be able to make use of use method when injectServices is true', function * () {
    const time = new Date().getTime()
    this.view.global('typeof', function (value) {
      return typeof (value)
    })
    const view = yield this.view.make('services')
    expect(view.trim()).to.equal('function')
  })

  it('should not be able to make use of use method when injectServices is false', function * () {
    const time = new Date().getTime()
    const customConfig = {
      get: function () {
        return false
      }
    }
    const view = new View(Helpers, customConfig, Route)
    view.global('typeof', function (value) {
      return typeof (value)
    })
    const compiledView = yield view.make('services')
    expect(compiledView.trim()).to.equal('undefined')
  })

})
