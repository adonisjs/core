/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { AppFactory } from '@adonisjs/application/factories'
import { HttpContextFactory } from '@adonisjs/http-server/factories'

import { Dumper } from '../../modules/dumper/dumper.js'
import { AceFactory } from '../../factories/core/ace.js'
import { E_DUMP_DIE_EXCEPTION } from '../../modules/dumper/errors.js'

test.group('Dumper', () => {
  test('dump and die', ({ fs }) => {
    const app = new AppFactory().create(fs.baseUrl)
    const dumper = new Dumper(app)

    dumper.dd('hello')
  }).throws('Dump and Die exception', E_DUMP_DIE_EXCEPTION)

  test('render dump as HTML', async ({ fs, assert }) => {
    assert.plan(3)
    const app = new AppFactory().create(fs.baseUrl)
    const dumper = new Dumper(app)

    const ctx = new HttpContextFactory().create()

    try {
      dumper.dd('hello')
    } catch (error) {
      await error.handle(error, ctx)
      assert.include(ctx.response.getBody(), '<style id="dumper-styles">')
      assert.include(ctx.response.getBody(), '<script id="dumper-script">')
      assert.include(ctx.response.getBody(), '<script>dumperActivate')
    }
  })

  test('render dump as HTML with csp nonce', async ({ fs, assert }) => {
    assert.plan(3)
    const app = new AppFactory().create(fs.baseUrl)
    const dumper = new Dumper(app)

    const ctx = new HttpContextFactory().create()
    ;(ctx.response as any).nonce = 'inline-code'

    try {
      dumper.dd('hello')
    } catch (error) {
      await error.handle(error, ctx)
      assert.include(ctx.response.getBody(), '<style id="dumper-styles">')
      assert.include(ctx.response.getBody(), '<script id="dumper-script" nonce="inline-code">')
      assert.include(ctx.response.getBody(), '<script nonce="inline-code">dumperActivate')
    }
  })

  test('render dump as ansi output', async ({ fs, assert }) => {
    assert.plan(2)
    const app = new AppFactory().create(fs.baseUrl)
    const ace = await new AceFactory().make(fs.baseUrl)
    ace.ui.switchMode('raw')
    const dumper = new Dumper(app)

    try {
      dumper.dd({ hello: 'world' })
    } catch (error) {
      await error.render(error, ace)

      assert.lengthOf(ace.ui.logger.getLogs(), 1)
      assert.include(
        ace.ui.logger.getLogs()[0].message.toLowerCase(),
        dumper
          .dumpToAnsi(
            { hello: 'world' },
            {
              title: 'DUMP DIE',
              source: {
                location: fileURLToPath(new URL('', import.meta.url)),
                line: 70,
              },
            }
          )
          .toLowerCase()
      )
    }
  })
})
