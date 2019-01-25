/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { outputFile, remove } from 'fs-extra'
import { join } from 'path'
import * as clearModule from 'clear-module'

import { Ignitor } from '../src/Ignitor'

const APP_DIR = join(__dirname, 'app')

test.group('Ignitor | ParseRc', (group) => {
  group.afterEach(async () => {
    await remove(APP_DIR)
  })

  test('work file when .adonisrc.json file is missing', (assert) => {
    const ignitor = new Ignitor()
    ignitor['_parseRcFile']()

    assert.deepEqual(ignitor.directories, {
      controllers: 'Controllers/Http',
      exceptions: 'Exceptions',
      listeners: 'Listeners',
      models: 'Models',
    })

    assert.deepEqual(ignitor.preloads, [])
  })

  test('merge directories with .adonisrc.json file directories', async (assert) => {
    // Setup
    await outputFile(join(APP_DIR, '.adonisrc.json'), JSON.stringify({
      directories: {
        validators: 'Validators',
      },
    }))

    const ignitor = new Ignitor()
    ignitor['_baseDir'] = APP_DIR
    ignitor['_rcPath'] = join(APP_DIR, '.adonisrc.json')
    ignitor['_parseRcFile']()

    assert.deepEqual(ignitor.directories, {
      controllers: 'Controllers/Http',
      exceptions: 'Exceptions',
      listeners: 'Listeners',
      models: 'Models',
      validators: 'Validators',
    })

    assert.deepEqual(ignitor.preloads, [])
    clearModule(join(APP_DIR, '.adonisrc.json'))
  })

  test('use preloads from adonisrc.json file', async (assert) => {
    // Setup
    await outputFile(join(APP_DIR, '.adonisrc.json'), JSON.stringify({
      preloads: [{
        file: 'start/kernel.js',
        intent: 'http',
        optional: false,
      }],
    }))

    const ignitor = new Ignitor()
    ignitor['_baseDir'] = APP_DIR
    ignitor['_rcPath'] = join(APP_DIR, '.adonisrc.json')
    ignitor['_parseRcFile']()

    assert.deepEqual(ignitor.preloads, [{
      file: 'start/kernel.js',
      intent: 'http',
      optional: false,
    }])

    clearModule(join(APP_DIR, '.adonisrc.json'))
  })
})

test.group('Ignitor | Preload', (group) => {
  group.afterEach(async () => {
    clearModule(join(APP_DIR, '.adonisrc.json'))
    clearModule(join(APP_DIR, 'start/kernel.js'))
    delete global['LOADED_KERNEL']
    await remove(APP_DIR)
  })

  test('load file when defined for the given intent', async (assert) => {
    // Setup
    await outputFile(join(APP_DIR, '.adonisrc.json'), JSON.stringify({
      preloads: [{
        file: 'start/kernel.js',
        intent: 'http',
        optional: false,
      }],
    }))

    await outputFile(join(APP_DIR, 'start/kernel.js'), `global.LOADED_KERNEL = true`)

    const ignitor = new Ignitor()
    ignitor['_baseDir'] = APP_DIR
    ignitor['_rcPath'] = join(APP_DIR, '.adonisrc.json')
    ignitor.forHttpServer()
    ignitor['_parseRcFile']()
    ignitor['_preloadFiles']()

    assert.isTrue(global['LOADED_KERNEL'])
  })

  test('do not load file when intent is different', async (assert) => {
    // Setup
    await outputFile(join(APP_DIR, '.adonisrc.json'), JSON.stringify({
      preloads: [{
        file: 'start/kernel.js',
        intent: 'ace',
        optional: false,
      }],
    }))

    await outputFile(join(APP_DIR, 'start/kernel.js'), `global.LOADED_KERNEL = true`)

    const ignitor = new Ignitor()
    ignitor['_baseDir'] = APP_DIR
    ignitor['_rcPath'] = join(APP_DIR, '.adonisrc.json')
    ignitor.forHttpServer()
    ignitor['_parseRcFile']()
    ignitor['_preloadFiles']()

    assert.isUndefined(global['LOADED_KERNEL'])
  })

  test('load file when intent is not defined', async (assert) => {
    // Setup
    await outputFile(join(APP_DIR, '.adonisrc.json'), JSON.stringify({
      preloads: [{
        file: 'start/kernel.js',
        optional: false,
      }],
    }))

    await outputFile(join(APP_DIR, 'start/kernel.js'), `global.LOADED_KERNEL = true`)

    const ignitor = new Ignitor()
    ignitor['_baseDir'] = APP_DIR
    ignitor['_rcPath'] = join(APP_DIR, '.adonisrc.json')
    ignitor.forAce()
    ignitor['_parseRcFile']()
    ignitor['_preloadFiles']()

    assert.isTrue(global['LOADED_KERNEL'])
  })

  test('raise error when file is missing', async (assert) => {
    // Setup
    await outputFile(join(APP_DIR, '.adonisrc.json'), JSON.stringify({
      preloads: [{
        file: 'start/kernel.js',
        optional: false,
      }],
    }))

    const ignitor = new Ignitor()
    ignitor['_baseDir'] = APP_DIR
    ignitor['_rcPath'] = join(APP_DIR, '.adonisrc.json')
    ignitor.forAce()
    ignitor['_parseRcFile']()

    const fn = () => ignitor['_preloadFiles']()
    assert.throw(fn, /ENOENT:/)
  })

  test('do not raise error when file is optional', async (assert) => {
    // Setup
    await outputFile(join(APP_DIR, '.adonisrc.json'), JSON.stringify({
      preloads: [{
        file: 'start/kernel.js',
        optional: true,
      }],
    }))

    const ignitor = new Ignitor()
    ignitor['_baseDir'] = APP_DIR
    ignitor['_rcPath'] = join(APP_DIR, '.adonisrc.json')
    ignitor.forAce()
    ignitor['_parseRcFile']()

    const fn = () => ignitor['_preloadFiles']()
    assert.doesNotThrow(fn)
  })

  test('raise error when file is optional but has syntax errors', async (assert) => {
    // Setup
    await outputFile(join(APP_DIR, '.adonisrc.json'), JSON.stringify({
      preloads: [{
        file: 'start/kernel.js',
        optional: true,
      }],
    }))

    await outputFile(join(APP_DIR, 'start/kernel.js'), `module.exports = `)

    const ignitor = new Ignitor()
    ignitor['_baseDir'] = APP_DIR
    ignitor['_rcPath'] = join(APP_DIR, '.adonisrc.json')
    ignitor.forAce()
    ignitor['_parseRcFile']()

    const fn = () => ignitor['_preloadFiles']()
    assert.throw(fn, /Unexpected token/)
  })
})

test.group('Ignitor | Preload', (group) => {
  group.afterEach(async () => {
    clearModule(join(APP_DIR, '.adonisrc.json'))
    clearModule(join(APP_DIR, 'start/kernel.js'))
    delete global['LOADED_KERNEL']
    await remove(APP_DIR)
  })

  test('raise error when intent is defined before calling start', async (assert) => {
    const ignitor = new Ignitor()
    const fn = () => ignitor.start()

    assert.throw(fn, 'E_MISSING_IGNITOR_INTENT: Cannot start ignitor as intent is missing')
  })
})
