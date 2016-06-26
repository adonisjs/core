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

const form = new Form(new View(Helpers, Config, Route).viewsEnv, Route)

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

  it("should throw an exception when you make url using a route name that doesn't exists", function () {
    Route.post('/users', 'UserController.store').as('users.store')

    try {
      const formTag = form.open({ route: 'user.store', method: 'POST' })
      expect(true).to.be.false
    } catch(e) {
      expect(e.message).to.match(/The route user.store has not been found/)
    }
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

  it('should create an input box using text method', function () {
    const label = form.text('email')
    expect(label.val).to.equal('<input type="text" name="email" id="email" />')
  })

  it('should be able to define extra attributes on input box', function () {
    const label = form.text('email', null, {class: 'small'})
    expect(label.val).to.equal('<input type="text" name="email" class="small" id="email" />')
  })

  it('should be able to define set placeholder attribute on input box', function () {
    const label = form.text('email', null, {placeholder: 'Enter your email address'})
    expect(label.val).to.equal('<input type="text" name="email" placeholder="Enter your email address" id="email" />')
  })

  it('should be able to define override id attribute on input box', function () {
    const label = form.text('email', null, {id: 'my-email'})
    expect(label.val).to.equal('<input type="text" name="email" id="my-email" />')
  })

  it('should create a password input using password method', function () {
    const label = form.password('password')
    expect(label.val).to.equal('<input type="password" name="password" id="password" />')
  })

  it('should create an email input using password method', function () {
    const label = form.email('email_address')
    expect(label.val).to.equal('<input type="email" name="email_address" id="email_address" />')
  })

  it('should create a file input using file method', function () {
    const label = form.file('profile')
    expect(label.val).to.equal('<input type="file" name="profile" id="profile" />')
  })

  it('should create a date input using date method', function () {
    const label = form.date('dob')
    expect(label.val).to.equal('<input type="date" name="dob" id="dob" />')
  })

  it('should create a color input using color method', function () {
    const label = form.color('themecolor')
    expect(label.val).to.equal('<input type="color" name="themecolor" id="themecolor" />')
  })

  it('should be able to use old values for the input', function () {
    const view = new View(Helpers, Config, Route)
    view.global('old', function () {
      return 'some value'
    })
    const formNew = new Form(view.viewsEnv, Route)
    const label = formNew.text('username')
    expect(label.val).to.equal('<input type="text" name="username" value="some value" id="username" />')
  })

  it('should not use old value when avoidOld has been passed', function () {
    const view = new View(Helpers, Config, Route)
    view.global('old', function () {
      return 'some value'
    })
    const formNew = new Form(view.viewsEnv, Route)
    const input = formNew.text('username', null, {avoidOld: true})
    expect(input.val).to.equal('<input type="text" name="username" id="username" />')
  })


  it('should create a url input using url method', function () {
    const label = form.url('blogLink')
    expect(label.val).to.equal('<input type="url" name="blogLink" id="blogLink" />')
  })

  it('should create a search input using search method', function () {
    const label = form.search('search')
    expect(label.val).to.equal('<input type="search" name="search" id="search" />')
  })

  it('should create a hidden input using hidden method', function () {
    const label = form.hidden('token')
    expect(label.val).to.equal('<input type="hidden" name="token" id="token" />')
  })

  it('should create a textarea using hidden method', function () {
    const label = form.textarea('description')
    expect(label.val).to.equal('<textarea name="description" id="description"></textarea>')
  })

  it('should create be able to attach attributes to textarea', function () {
    const label = form.textarea('description', null, {class: 'big'})
    expect(label.val).to.equal('<textarea name="description" class="big" id="description"></textarea>')
  })

  it('should be able to define value for textarea', function () {
    const label = form.textarea('description', 'Enter description')
    expect(label.val).to.equal('<textarea name="description" id="description">Enter description</textarea>')
  })

  it('should be able to use old values for textarea', function () {
    const label = form.textarea('description', 'Enter description')
    expect(label.val).to.equal('<textarea name="description" id="description">Enter description</textarea>')
  })

  it('should create a radio button using radio method', function () {
    const label = form.radio('sex', 'male')
    expect(label.val).to.equal('<input type="radio" name="sex" value="male" id="sex" />')
  })

  it('should be to able to select radio button', function () {
    const label = form.radio('sex', 'male', true)
    expect(label.val).to.equal('<input type="radio" name="sex" value="male" checked="checked" id="sex" />')
  })

  it('should create a checkbox using checkbox method', function () {
    const label = form.checkbox('admin', 'yes')
    expect(label.val).to.equal('<input type="checkbox" name="admin" value="yes" id="admin" />')
  })

  it('should be to able to select checkbox', function () {
    const label = form.checkbox('admin', 'yes', true)
    expect(label.val).to.equal('<input type="checkbox" name="admin" value="yes" checked="checked" id="admin" />')
  })

  it('should be able to create a selectbox', function () {
    const label = form.select('countries', ['India', 'Usa', 'Brazil'])
    const expected =
`<select name="countries" id="countries">
<option value="India"> India </option>
<option value="Usa"> Usa </option>
<option value="Brazil"> Brazil </option>
</select>`
    expect(label.val).to.equal(expected)
  })

  it('should be able to define diffrent keys and values for options', function () {
    const label = form.select('countries', {'ind': 'India', 'us': 'Usa'})
    const expected =
`<select name="countries" id="countries">
<option value="ind"> India </option>
<option value="us"> Usa </option>
</select>`
    expect(label.val).to.equal(expected)
  })

  it('should be able to define attributes on select box', function () {
    const label = form.select('countries', {'ind': 'India', 'us': 'Usa'}, null, null, {multiple: true})
    const expected =
`<select name="countries" multiple="true" id="countries">
<option value="ind"> India </option>
<option value="us"> Usa </option>
</select>`
    expect(label.val).to.equal(expected)
  })

  it('should be able to define selected option on select box', function () {
    const label = form.select('countries', {'ind': 'India', 'us': 'Usa'}, 'ind')
    const expected =
`<select name="countries" id="countries">
<option selected="true" value="ind"> India </option>
<option value="us"> Usa </option>
</select>`
    expect(label.val).to.equal(expected)
  })

  it('should be able to define selected option on select box when using array', function () {
    const label = form.select('countries', ['India', 'Usa', 'Brazil'], 'India')
    const expected =
`<select name="countries" id="countries">
<option selected="true" value="India"> India </option>
<option value="Usa"> Usa </option>
<option value="Brazil"> Brazil </option>
</select>`
    expect(label.val).to.equal(expected)
  })

  it('should be able to define multiple selected option on select box', function () {
    const label = form.select('countries', {'ind': 'India', 'us': 'Usa'}, ['ind', 'us'])
    const expected =
`<select name="countries" id="countries">
<option selected="true" value="ind"> India </option>
<option selected="true" value="us"> Usa </option>
</select>`
    expect(label.val).to.equal(expected)
  })

  it('should be able to define empty input as first option', function () {
    const label = form.select('countries', {'ind': 'India', 'us': 'Usa'}, null, 'Select Country')
    const expected =
`<select name="countries" id="countries">
<option value=""> Select Country </option>
<option value="ind"> India </option>
<option value="us"> Usa </option>
</select>`
    expect(label.val).to.equal(expected)
  })

  it('should be able to define range inside select box', function () {
    const label = form.selectRange('number', 1, 4)
    const expected =
`<select name="number" id="number">
<option value="1"> 1 </option>
<option value="2"> 2 </option>
<option value="3"> 3 </option>
</select>`
    expect(label.val).to.equal(expected)
  })

  it('should be able to define opposite range inside select box', function () {
    const label = form.selectRange('number', 3, 0)
    const expected =
`<select name="number" id="number">
<option value="3"> 3 </option>
<option value="2"> 2 </option>
<option value="1"> 1 </option>
</select>`
    expect(label.val).to.equal(expected)
  })

  it('should create a submit button using submit method', function () {
    const label = form.submit('Submit')
    expect(label.val).to.equal('<input type="submit" name="submit" value="Submit" id="submit" />')
  })

  it('should be able to define extra attributes on submit button', function () {
    const label = form.submit('Submit', null, {class: 'small'})
    expect(label.val).to.equal('<input type="submit" name="submit" value="Submit" class="small" id="submit" />')
  })

  it('should be able to define name of submit button', function () {
    const label = form.submit('Create Account', 'create')
    expect(label.val).to.equal('<input type="submit" name="create" value="Create Account" id="create" />')
  })

  it('should create a button using button method', function () {
    const label = form.button('Submit')
    expect(label.val).to.equal('<button type="submit" name="submit" value="Submit" id="submit"> Submit </button>')
  })

  it('should be able to define extra attributes on button', function () {
    const label = form.button('Submit', null, {class: 'big'})
    expect(label.val).to.equal('<button type="submit" name="submit" value="Submit" class="big" id="submit"> Submit </button>')
  })

  it('should be able to define a different name for button', function () {
    const label = form.button('Create Account', 'create')
    expect(label.val).to.equal('<button type="submit" name="create" value="Create Account" id="create"> Create Account </button>')
  })

  it('should create a reset button using resetButton method', function () {
    const label = form.resetButton('Clear Form')
    expect(label.val).to.equal('<button type="reset" name="reset" value="Clear Form" id="reset"> Clear Form </button>')
  })

  it('should create a reset button by passing type to reset inside button method', function () {
    const label = form.button('Clear Form', 'clear', {type: 'reset'})
    expect(label.val).to.equal('<button type="reset" name="clear" value="Clear Form" id="clear"> Clear Form </button>')
  })
})
