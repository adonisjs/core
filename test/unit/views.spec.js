'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const path = require('path')
const fs = require('fs-extra')
const pify = require('pify')
const { Helpers } = require('@adonisjs/sink')
const View = require('../../src/View')
const globals = require('../../src/View/globals')
const Tags = require('../../src/View/Tags')
const RouteStore = require('../../src/Route/Store')
const RouteManager = require('../../src/Route/Manager')

test.group('View', (group) => {
  group.before(async () => {
    await pify(fs.ensureDir)(path.join(__dirname, 'resources/views'))
  })

  group.after(async () => {
    await pify(fs.remove)(path.join(__dirname, 'resources'))
  })

  group.beforeEach(() => {
    this.helpers = new Helpers(path.join(__dirname, './'))
  })

  test('configure edge', (assert) => {
    const view = new View(this.helpers)
    assert.equal(view.engine._loader._viewsPath, path.join(__dirname, './resources/views'))
    assert.equal(view.engine._loader._presentersPath, path.join(__dirname, './resources/presenters'))
    assert.equal(view.engine._options.cache, false)
  })

  test('configure edge with cache enabled', (assert) => {
    const view = new View(this.helpers, true)
    assert.equal(view.engine._options.cache, true)
  })

  test('call edge methods directly on the engine', (assert) => {
    const view = new View(this.helpers, true)
    assert.equal(view.engine.renderString('{{ 2 + 2 }}').trim(), '4')
  })

  test('define globals', (assert) => {
    const view = new View(this.helpers, true)
    const fn = function () {}
    view.global('myGlobal', fn)
    assert.equal(view.engine._globals.myGlobal, fn)
  })

  test('render string', (assert) => {
    const view = new View(this.helpers, true)
    assert.equal(view.renderString('{{ 2 + 2 }}').trim(), '4')
  })

  test('share locals', (assert) => {
    const view = new View(this.helpers, true)
    assert.equal(view.share({age: 22}).renderString('{{ age }}').trim(), '22')
  })

  test('render a view', async (assert) => {
    await pify(fs.writeFile)(path.join(__dirname, 'resources/views/hello.edge'), 'Hello {{ name }}')
    const view = new View(this.helpers, true)
    assert.equal(view.render('hello', { name: 'virk' }).trim(), 'Hello virk')
  })

  test('get access to the base presenter', async (assert) => {
    const view = new View(this.helpers, true)
    assert.isDefined(view.BasePresenter)
  })
})

test.group('Views globals', (group) => {
  group.afterEach(() => {
    RouteStore.clear()
  })

  test('make url for a route', (assert) => {
    const view = new View(this.helpers)
    globals(view, RouteManager)
    RouteManager.route('users/:id', function () {}).as('profile')
    const template = `{{ route('profile', { id: 1 }) }}`
    assert.equal(view.renderString(template).trim(), '/users/1')
  })

  test('get path to assets', (assert) => {
    const view = new View(this.helpers)
    globals(view, RouteManager)
    RouteManager.route('users/:id', function () {}).as('profile')
    const template = `{{ assetsUrl('style.css') }}`
    assert.equal(view.renderString(template).trim(), '/style.css')
  })

  test('do not prefix when http or https', (assert) => {
    const view = new View(this.helpers)
    globals(view, RouteManager)
    RouteManager.route('users/:id', function () {}).as('profile')
    const template = `{{ assetsUrl('https://style.css') }}`
    assert.equal(view.renderString(template).trim(), 'https://style.css')
  })

  test('make link tag', (assert) => {
    const view = new View(this.helpers)
    globals(view, RouteManager)
    RouteManager.route('users/:id', function () {}).as('profile')
    const template = `{{ css('style.css') }}`
    assert.equal(view.renderString(template).trim(), '<link rel="stylesheet" href="/style.css" />')
  })

  test('make link tag when there is no .css extension', (assert) => {
    const view = new View(this.helpers)
    globals(view, RouteManager)
    RouteManager.route('users/:id', function () {}).as('profile')
    const template = `{{ css('style') }}`
    assert.equal(view.renderString(template).trim(), '<link rel="stylesheet" href="/style.css" />')
  })

  test('do not add .css when there skipPrefix is true', (assert) => {
    const view = new View(this.helpers)
    globals(view, RouteManager)
    RouteManager.route('users/:id', function () {}).as('profile')
    const template = `{{ css('style', true) }}`
    assert.equal(view.renderString(template).trim(), '<link rel="stylesheet" href="/style" />')
  })

  test('make script tag', (assert) => {
    const view = new View(this.helpers)
    globals(view, RouteManager)
    RouteManager.route('users/:id', function () {}).as('profile')
    const template = `{{ script('app.js') }}`
    assert.equal(view.renderString(template).trim(), '<script type="text/javascript" src="/app.js"></script>')
  })

  test('make script tag without .js prefix', (assert) => {
    const view = new View(this.helpers)
    globals(view, RouteManager)
    RouteManager.route('users/:id', function () {}).as('profile')
    const template = `{{ script('app') }}`
    assert.equal(view.renderString(template).trim(), '<script type="text/javascript" src="/app.js"></script>')
  })

  test('do not add .js when skipPrefix is true', (assert) => {
    const view = new View(this.helpers)
    globals(view, RouteManager)
    RouteManager.route('users/:id', function () {}).as('profile')
    const template = `{{ script('app', true) }}`
    assert.equal(view.renderString(template).trim(), '<script type="text/javascript" src="/app"></script>')
  })
})

test.group('Views tags', () => {
  test('convert inline svg to svg source', (assert) => {
    const view = new View(this.helpers)

    Tags(view, this.helpers)

    const fooSvg = path.join(__dirname, './public', 'logo.svg')
    const template = `@inlineSvg('${fooSvg}')`
    assert.equal(view.renderString(template).trim(), '<svg id="logo"></svg>')
  })

  test('throw exception with correct lineno when file is not found', (assert) => {
    assert.plan(3)

    const view = new View(this.helpers)
    Tags(view, this.helpers)

    const fooSvg = path.join(__dirname, './public', 'foo.svg')
    const template = `
    <h2> Hello </h2>
    @inlineSvg('${fooSvg}')
    `

    try {
      view.renderString(template).trim()
    } catch ({ code, lineno, charno }) {
      assert.equal(code, 'ENOENT')
      assert.equal(lineno, 2)
      assert.equal(charno, 1)
    }
  })

  test('load file when path is not absolute', (assert) => {
    const view = new View(this.helpers)
    Tags(view, this.helpers)

    const template = `@inlineSvg('logo.svg')`
    assert.equal(view.renderString(template).trim(), '<svg id="logo"></svg>')
  })

  test('prefix svg extension if missing', (assert) => {
    const view = new View(this.helpers)
    Tags(view, this.helpers)

    const template = `@inlineSvg('logo')`
    assert.equal(view.renderString(template).trim(), '<svg id="logo"></svg>')
  })
})
