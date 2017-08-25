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
const Env = require('../../src/Env')
const { Helpers } = require('@adonisjs/sink')

test.group('Env', (group) => {
  group.beforeEach(() => {
    this.helpers = new Helpers(path.join(__dirname))
  })

  test('load .env file by initiating Env class', (assert) => {
    assert.plan(1)

    /* eslint-disable no-new */
    try {
      new Env(this.helpers._appRoot)
    } catch ({ message }) {
      assert.match(message, /ENOENT: no such file or directory, open/)
    }
  })

  test('ignore error when file is ENV_SILENT is true', (assert) => {
    process.env.ENV_SILENT = true

    /* eslint-disable no-new */
    new Env(this.helpers._appRoot)
    delete process.env.ENV_SILENT
  })

  test('load env file from a different location', (assert) => {
    process.env.ENV_PATH = './user/.env'

    /* eslint-disable no-new */
    new Env(this.helpers._appRoot)
    assert.equal(process.env.HELLO, 'WORLD')
  })

  test('get value for a given key', (assert) => {
    process.env.ENV_PATH = './user/.env'
    const env = new Env(this.helpers._appRoot)
    assert.equal(env.get('HELLO'), 'WORLD')
  })

  test('get default value when actual value is missing', (assert) => {
    process.env.ENV_PATH = './user/.env'
    const env = new Env(this.helpers._appRoot)
    assert.equal(env.get('FOO', 'BAR'), 'BAR')
  })

  test('set value for a given key', (assert) => {
    process.env.ENV_PATH = './user/.env'
    const env = new Env(this.helpers._appRoot)
    env.set('FOO', 'BAZ')
    assert.equal(env.get('FOO', 'BAR'), 'BAZ')
  })

  test('load new config file and overwrite existing file', (assert) => {
    const env = new Env(this.helpers._appRoot)
    env.load('./user/.env.override')
    assert.equal(process.env.HELLO, 'UNIVERSE')
  })
})
