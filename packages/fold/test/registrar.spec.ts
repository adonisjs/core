/*
* @adonisjs/fold
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { outputFile, remove } from 'fs-extra'
import * as clearModule from 'clear-module'
import { join } from 'path'

import * as test from 'japa'
import { Registrar } from '../src/Registrar'
import { Ioc } from '../src/Ioc'

const APP = join(__dirname, './app')

test.group('Registrar', (group) => {
  group.afterEach(async () => {
    await remove(APP)
  })

  test('register an array of providers', async (assert) => {
    await outputFile(join(APP, 'providers', 'FooProvider.js'), `module.exports = class MyProvider {
      constructor () {
        this.registered = false
      }

      register () {
        this.registered = true
      }
    }`)

    const registrar = new Registrar(new Ioc())
    registrar.useProviders([join(APP, 'providers', 'FooProvider')])

    const providers = registrar.register()
    assert.isTrue((providers[0] as any).registered)

    clearModule.all()
  })

  test('register an array of providers when defined as es6 modules', async (assert) => {
    await outputFile(join(APP, 'providers', 'BarProvider.ts'), `export default class MyProvider {
      public registered = false
      register () {
        this.registered = true
      }
    }`)

    const registrar = new Registrar(new Ioc(false))
    registrar.useProviders([join(APP, 'providers', 'BarProvider')])

    const providers = registrar.register()
    assert.isTrue((providers[0] as any).registered)

    clearModule.all()
  })

  test('register and boot providers together', async (assert) => {
    await outputFile(join(APP, 'providers', 'BarProvider.ts'), `export default class MyProvider {
      public registered = false
      public booted = false

      register () {
        this.registered = true
      }

      async boot () {
        this.booted = true
      }
    }`)

    const registrar = new Registrar(new Ioc(false))
    registrar.useProviders([join(APP, 'providers', 'BarProvider')])

    const providers = await registrar.registerAndBoot()
    assert.isTrue((providers[0] as any).registered)
    assert.isTrue((providers[0] as any).booted)

    clearModule.all()
  })
})
