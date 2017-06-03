'use strict'

/**
 * adonis-framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
 */
const View = require('../../src/View')
const Route = require('../../src/Route')
const chai = require('chai')
const cheerio = require('cheerio')
const path = require('path')
const expect = chai.expect
require('co-mocha')

const Helpers = {
  viewsPath: function () {
    return path.join(__dirname, './app/views')
  }
}
const Config = {
  get: function () {
    return true
  }
}

describe('View', function () {
  before(function () {
    this.view = new View(Helpers, Config, Route)
  })

  beforeEach(function () {
    Route.new()
  })

  it('should throw an error when unable to find view', function * () {
    try {
      yield this.view.make('foo.html')
      expect(true).to.be.false
    } catch (e) {
      expect(e.message).to.match(/template not found/)
    }
  })

  it("should make a view using it's path", function * () {
    const index = yield this.view.make('index.njk')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it("should make a view using it's path without .njk extension", function * () {
    const index = yield this.view.make('index')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make a nested view using a /', function * () {
    const index = yield this.view.make('subviews/index')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make a nested view using a / and the extension', function * () {
    const index = yield this.view.make('subviews/index.njk')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make a nested view using a .', function * () {
    const index = yield this.view.make('subviews.index')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make a nested view using a . and the extension', function * () {
    const index = yield this.view.make('subviews.index.njk')
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
    Route.get('/:id', 'ProfileController.show').as('profile')
    const profile = yield this.view.make('profile', {id: 1})
    expect(profile.trim()).to.equal('/1')
  })

  it('should make use of action filter inside views', function * () {
    Route.get('/:id', 'ProfileController.show').as('profile')
    const profile = yield this.view.make('profileAction', {id: 1})
    expect(profile.trim()).to.equal('/1')
  })

  it('should throw exception when unable to find route action inside route filter', function * () {
    const fn = () => this.view.makeString('{{ "ProfileController.show" | action({id:1}) }}')
    expect(fn).to.throw(/RuntimeException: E_MISSING_ROUTE_ACTION: The action ProfileController\.show has not been found/)
  })

  it('should make an anchor link to a given route', function * () {
    Route.get('/:id', 'ProfileController.show').as('profile')
    const viewString = this.view.makeString('{{ linkTo("profile", "View Profile", {id: 1}) }}')
    expect(viewString.trim()).to.equal('<a href="/1" > View Profile </a>')
  })

  it('should make an anchor link with defined target to a given route', function * () {
    Route.get('/users', 'ProfileController.show').as('listUsers')
    const viewString = this.view.makeString('{{ linkTo("listUsers", "View Profile", {}, "_blank") }}')
    expect(viewString.trim()).to.equal('<a href="/users" target="_blank"> View Profile </a>')
  })

  it('should make an anchor link to a given action', function * () {
    Route.get('profile/:id', 'ProfileController.show')
    const viewString = this.view.makeString('{{ linkToAction("ProfileController.show", "View Profile", {id: 1}) }}')
    expect(viewString.trim()).to.equal('<a href="/profile/1" > View Profile </a>')
  })

  it('should make an anchor link with defined target to a given action', function * () {
    Route.get('profile/:id', 'ProfileController.show')
    const viewString = this.view.makeString('{{ linkToAction("ProfileController.show", "View Profile", {id: 1}, "_blank") }}')
    expect(viewString.trim()).to.equal('<a href="/profile/1" target="_blank"> View Profile </a>')
  })

  it('should stringify json', function * () {
    const jsonView = yield this.view.make('json', {profile: {name: 'virk'}})
    expect(jsonView.trim()).to.equal(JSON.stringify({name: 'virk'}, null, 2))
  })

  it('should be able to make use of yield keyword inside view', function * () {
    const profile = {
      get: function * () {
        return 'virk'
      }
    }
    const asyncView = yield this.view.make('async', {profile})
    expect(asyncView.trim()).to.equal('virk')
  })

  it('should return error thrown by yield method', function * () {
    const profile = {
      get: function * () {
        throw new Error('What you want?')
      }
    }
    try {
      yield this.view.make('async', {profile})
    } catch (e) {
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
    new Date().getTime()
    this.view.global('typeof', function (value) {
      return typeof (value)
    })
    const view = yield this.view.make('services')
    expect(view.trim()).to.equal('function')
  })

  it('should not be able to make use of use method when injectServices is false', function * () {
    new Date().getTime()
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

  it('be able to include a view inside a for loop', function * () {
    const compiledView = yield this.view.make('for', {users: [{username: 'foo'}, {username: 'bar'}]})
    const $ = cheerio.load(compiledView.trim())
    expect($('li').length).to.equal(2)
  })

  it('return a clone instance of itself', function () {
    const clonedView = this.view.clone()
    expect(clonedView).instanceOf(this.view.constructor)
  })

  it('should not mutate the original view when made changes to cloned copy', function () {
    const clonedView = this.view.clone()
    clonedView.global('name', 'foo')
    expect(this.view.viewsEnv.globals.name).is.undefined
    expect(clonedView.viewsEnv.globals.name).to.equal('foo')
  })

  it('should not mutate the sibling clones', function () {
    const clonedView = this.view.clone()
    const clonedView1 = this.view.clone()
    clonedView.global('name', 'foo')
    expect(this.view.viewsEnv.globals.name).is.undefined
    expect(clonedView1.viewsEnv.globals.name).is.undefined
    expect(clonedView.viewsEnv.globals.name).to.equal('foo')
  })
})
