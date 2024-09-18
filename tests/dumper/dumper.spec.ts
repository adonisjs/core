/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { AppFactory } from '@adonisjs/application/factories'
import { Dumper } from '../../modules/dumper/dumper.js'
import { E_DUMP_DIE_EXCEPTION } from '../../modules/dumper/errors.js'
import { HttpContextFactory } from '@adonisjs/http-server/factories'
import { AceFactory } from '../../factories/core/ace.js'

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
    const app = new AppFactory().create(fs.baseUrl)
    const ace = await new AceFactory().make(fs.baseUrl)
    ace.ui.switchMode('raw')
    const dumper = new Dumper(app)

    try {
      dumper.dd({ hello: 'world' })
    } catch (error) {
      await error.render(error, ace)
      assert.deepEqual(ace.ui.logger.getLogs(), [
        {
          message:
            "\x1B[33m{\x1B[39m\n  \x1B[34mhello\x1B[39m: \x1B[32m'world'\x1B[39m,\n\x1B[33m}\x1B[39m",
          stream: 'stdout',
        },
      ])
    }
  })
})
