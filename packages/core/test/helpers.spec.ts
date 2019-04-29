/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { join } from 'path'
import { Ignitor } from '../src/Ignitor'
import { Helpers } from '../src/Helpers'

const APP_ROOT = join(__dirname, 'app')

test.group('Helpers', () => {
  test('make path to all conventional directories', (assert) => {
    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_loadRcFile']()

    const helpers = new Helpers(ignitor.appRoot, ignitor.directories)

    assert.equal(helpers.appRoot(), APP_ROOT)
    assert.equal(helpers.configPath(), join(APP_ROOT, 'config'))
    assert.equal(helpers.publicPath(), join(APP_ROOT, 'public'))
    assert.equal(helpers.databasePath(), join(APP_ROOT, 'database'))
    assert.equal(helpers.migrationsPath(), join(APP_ROOT, 'database/migrations'))
    assert.equal(helpers.seedsPath(), join(APP_ROOT, 'database/seeds'))
    assert.equal(helpers.resourcesPath(), join(APP_ROOT, 'resources'))
    assert.equal(helpers.viewsPath(), join(APP_ROOT, 'resources/views'))
    assert.equal(helpers.tmpPath(), join(APP_ROOT, 'tmp'))
  })

  test('make path to additional directories/files', (assert) => {
    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_loadRcFile']()

    const helpers = new Helpers(ignitor.appRoot, ignitor.directories)

    assert.equal(helpers.appRoot('server.js'), join(APP_ROOT, 'server.js'))
    assert.equal(helpers.configPath('app.js'), join(APP_ROOT, 'config', 'app.js'))
    assert.equal(helpers.publicPath('style.css'), join(APP_ROOT, 'public', 'style.css'))
    assert.equal(helpers.databasePath('factory.js'), join(APP_ROOT, 'database', 'factory.js'))
    assert.equal(helpers.migrationsPath('users.js'), join(APP_ROOT, 'database', 'migrations', 'users.js'))
    assert.equal(helpers.seedsPath('main.js'), join(APP_ROOT, 'database', 'seeds', 'main.js'))
    assert.equal(helpers.resourcesPath('style.scss'), join(APP_ROOT, 'resources', 'style.scss'))
    assert.equal(helpers.viewsPath('main.edge'), join(APP_ROOT, 'resources/views', 'main.edge'))
    assert.equal(helpers.tmpPath('uploads'), join(APP_ROOT, 'tmp', 'uploads'))
  })

  test('sleep async executation context', async (assert) => {
    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_loadRcFile']()

    const helpers = new Helpers(ignitor.appRoot, ignitor.directories)

    const start = new Date().getTime()
    await helpers.sleep(500)
    const diff = new Date().getTime() - start
    assert.isAbove(diff, 499)
  })
})
