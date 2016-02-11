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

describe('View',function () {

  before(function () {
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
    this.view = new View(Helpers, Config, Route)
  })

  beforeEach(function () {
    Route.new()
  })

  it('should throw an error when unable to find view', function * () {
    try{
       yield this.view.make('foo.html')
    }catch(e){
      expect(e.message).to.match(/template not found/)
    }
  })

  it('should make a view using it\'s path', function * () {
    const index = yield this.view.make('index.html')
    expect(index.trim()).to.equal('<h2> Hello world </h2>')
  })

  it('should make a view using it\'s path without .html extension', function * () {
    const index = yield this.view.make('index')
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

  it('should return empty string when unable to find route action', function * () {
    const profile = this.view.makeString('{{ "ProfileController.show" | action({id:1}) }}',{id:1})
    expect(profile.trim()).to.equal('')
  })

  it('should stringify json', function * () {
    const jsonView = yield this.view.make('json',{profile:{name:"virk"}})
    expect(jsonView.trim()).to.equal(JSON.stringify({name:"virk"}))
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

})
