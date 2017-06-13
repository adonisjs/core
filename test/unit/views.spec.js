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
