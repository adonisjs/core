'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const chai = require('chai')
const expect = chai.expect
const Form = require('../../src/View/Form')
const View = require('../../src/View')
const Route = require('../../src/Route')
const path = require('path')
const Helpers = {
  viewsPath: function () {
    return path.join(__dirname, './app/views')
  }
}

const Config = {
  get: function () {
    return false
  }
}

const form = new Form(new View(Helpers, Config, Route), Route)

describe('Form Helper', function () {
  it('should be able to create a form opening tag using open method', function () {
    const formTag = form.open({url: '/user', method: 'POST'})
    expect(formTag.val).to.equal('<form method="POST" action="/user" enctype="application/x-www-form-urlencoded">')
  })

  it('should be able to set enctype to multiple form data when files are set to true', function () {
    const formTag = form.open({url: '/user', method: 'POST', files: true})
    expect(formTag.val).to.equal('<form method="POST" action="/user" enctype="multipart/form-data">')
  })

  it('should be able to define additional attributes on form tag', function () {
    const formTag = form.open({url: '/user', method: 'POST', files: true, novalidate: true })
    expect(formTag.val).to.equal('<form method="POST" action="/user" enctype="multipart/form-data" novalidate="true">')
  })

  it('should be able to define multiple classes from formtag', function () {
    const formTag = form.open({url: '/user', method: 'POST', class: 'form form--small' })
    expect(formTag.val).to.equal('<form method="POST" action="/user" enctype="application/x-www-form-urlencoded" class="form form--small">')
  })

  it('should be able to define method other than POST', function () {
    const formTag = form.open({url: '/', method: 'put'})
    expect(formTag.val).to.equal('<form method="POST" action="/?_method=PUT" enctype="application/x-www-form-urlencoded">')
  })

  it('should be able to define method other than POST and should respect existing query string values', function () {
    const formTag = form.open({url: '/?page=1', method: 'put'})
    expect(formTag.val).to.equal('<form method="POST" action="/?page=1&_method=PUT" enctype="application/x-www-form-urlencoded">')
  })

  it('should be able to make url using route name', function () {
    Route.post('/users', 'UserController.store').as('storeUser')
    const formTag = form.open({route: 'storeUser', method: 'POST'})
    expect(formTag.val).to.equal('<form method="POST" action="/users" enctype="application/x-www-form-urlencoded">')
  })

  it('should be able to make url using route name with params', function () {
    Route.delete('/user/:id', 'UserController.delete').as('deleteUser')
    const formTag = form.open({route: 'deleteUser', params: {id: 1} })
    expect(formTag.val).to.equal('<form method="POST" action="/user/1?_method=DELETE" enctype="application/x-www-form-urlencoded">')
  })

  it('should be able to make url using controller.action binding', function () {
    Route.put('/users', 'UserController.update').as('getUsers')
    const formTag = form.open({action: 'UserController.update'})
    expect(formTag.val).to.equal('<form method="POST" action="/users?_method=PUT" enctype="application/x-www-form-urlencoded">')
  })

  it('should be able to create label', function () {
    const label = form.label('email', 'Enter your email address')
    expect(label.val).to.equal('<label name="email"> Enter your email address </label>')
  })

  it('should be able to define extra attributes with label', function () {
    const label = form.label('email', 'Enter your email address', {class: 'flat'})
    expect(label.val).to.equal('<label name="email" class="flat"> Enter your email address </label>')
  })

})
