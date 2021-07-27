/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { join } from 'path'
import { setupApp, fs } from '../test-helpers'
import { DriveManager } from '../src/Drive/DriveManager'

test.group('Drive Manager', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('make instance of the local driver', async (assert) => {
    const app = await setupApp()

    const config = {
      disk: 'local' as const,
      disks: {
        local: {
          driver: 'local' as const,
          root: join(fs.basePath, 'storage'),
          basePath: '/uploads',
          visibility: 'public' as const,
        },
      },
    }

    const router = app.container.resolveBinding('Adonis/Core/Route')
    const drive = new DriveManager(app, router, config)
    assert.isFalse(await drive.use('local').exists('foo.txt'))
  })

  test('run operations using the default disk', async (assert) => {
    const app = await setupApp()

    const config = {
      disk: 'local' as const,
      disks: {
        local: {
          driver: 'local' as const,
          root: join(fs.basePath, 'storage'),
          basePath: '/uploads',
          visibility: 'public' as const,
        },
      },
    }

    const router = app.container.resolveBinding('Adonis/Core/Route')
    const drive = new DriveManager(app, router, config)

    await drive.put('foo.txt', 'hello world')
    assert.equal((await drive.get('foo.txt')).toString(), 'hello world')
  })

  test('extend drive to add a custom driver', async (assert) => {
    assert.plan(2)
    const app = await setupApp()

    const config = {
      disk: 's3' as const,
      disks: {
        s3: {
          driver: 's3' as const,
        },
      },
    } as any

    class DummyS3 {
      public put(filePath: string, contents: any) {
        assert.equal(filePath, 'foo.txt')
        assert.equal(contents, 'hello world')
      }
    }

    const router = app.container.resolveBinding('Adonis/Core/Route')
    const drive = new DriveManager(app, router, config)
    drive.extend('s3', () => new DummyS3() as any)

    await drive.put('foo.txt', 'hello world')
  })
})
