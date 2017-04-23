'use strict'

/*
 * adonis-sink
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const path = require('path')

const Helpers = require('../../src/Helpers')

test.group('Helpers', (group) => {
  group.beforeEach(() => {
    this.helpers = new Helpers(path.join(__dirname, './'))
  })

  test('return path to public dir', (assert) => {
    assert.equal(this.helpers.publicPath(), path.join(__dirname, './public'))
  })

  test('return path to a file inside public dir', (assert) => {
    assert.equal(this.helpers.publicPath('style.css'), path.join(__dirname, './public/style.css'))
  })

  test('return path to resources dir', (assert) => {
    assert.equal(this.helpers.resourcesPath(), path.join(__dirname, './resources'))
  })

  test('return path to a file inside resources dir', (assert) => {
    assert.equal(this.helpers.resourcesPath('assets/style.scss'), path.join(__dirname, './resources/assets/style.scss'))
  })

  test('return path to views dir', (assert) => {
    assert.equal(this.helpers.viewsPath(), path.join(__dirname, './resources/views'))
  })

  test('return path to a file inside views dir', (assert) => {
    assert.equal(this.helpers.viewsPath('master.edge'), path.join(__dirname, './resources/views/master.edge'))
  })

  test('return path to database dir', (assert) => {
    assert.equal(this.helpers.databasePath(), path.join(__dirname, './database'))
  })

  test('return path to a file inside database dir', (assert) => {
    assert.equal(this.helpers.databasePath('database.sqlite3'), path.join(__dirname, './database/database.sqlite3'))
  })

  test('return path to migrations dir', (assert) => {
    assert.equal(this.helpers.migrationsPath(), path.join(__dirname, './database/migrations'))
  })

  test('return path to a file inside migrations dir', (assert) => {
    assert.equal(this.helpers.migrationsPath('foo.js'), path.join(__dirname, './database/migrations/foo.js'))
  })

  test('return path to seeds dir', (assert) => {
    assert.equal(this.helpers.seedsPath(), path.join(__dirname, './database/seeds'))
  })

  test('return path to a file inside seeds dir', (assert) => {
    assert.equal(this.helpers.seedsPath('foo.js'), path.join(__dirname, './database/seeds/foo.js'))
  })

  test('return path to tmp dir', (assert) => {
    assert.equal(this.helpers.tmpPath(), path.join(__dirname, './tmp'))
  })

  test('return path to a file inside tmp dir', (assert) => {
    assert.equal(this.helpers.tmpPath('logs.txt'), path.join(__dirname, './tmp/logs.txt'))
  })
})
