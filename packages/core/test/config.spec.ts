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
import { Filesystem } from '@adonisjs/dev-utils'
import { Config } from '../src/Config'

const fs = new Filesystem()

test.group('Config', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('load .js config files from the app root', async (assert) => {
    await fs.add('config/app.js', `module.exports = {
      logger: {
        driver: 'file'
      }
    }`)

    const config = new Config(join(fs.basePath, 'config'))
    assert.deepEqual(config['_configCache'], {
      app: {
        logger: {
          driver: 'file',
        },
      },
    })
  })

  test('load .ts config files from the app root', async (assert) => {
    await fs.add('config/app.ts', `export = {
      logger: {
        driver: 'file'
      }
    }`)

    const config = new Config(join(fs.basePath, 'config'))
    assert.deepEqual(config['_configCache'], {
      app: {
        logger: {
          driver: 'file',
        },
      },
    })
  })

  test('do not raise errors when there are no config files', async (assert) => {
    const config = new Config(join(fs.basePath, 'config'))
    assert.deepEqual(config['_configCache'], {})
  })

  test('merge config with given defaults', async (assert) => {
    await fs.add('config/app.js', `module.exports = {
      logger: {
        driver: 'file'
      }
    }`)

    const config = new Config(join(fs.basePath, 'config'))
    assert.deepEqual(config.merge('app.logger', { filePath: 'foo' }), {
      driver: 'file',
      filePath: 'foo',
    })
  })

  test('define merge config customizer', async (assert) => {
    await fs.add('config/app.js', `module.exports = {
      logger: {
        driver: 'file'
      }
    }`)

    const config = new Config(join(fs.basePath, 'config'))

    assert.deepEqual(config.merge('app.logger', { filePath: 'foo' }, (_objValue, _srcValue, key) => {
      if (key === 'driver') {
        return 'memory'
      }
    }), {
        driver: 'memory',
        filePath: 'foo',
      })
  })

  test('update in-memory config value', async (assert) => {
    await fs.add('config/app.js', `module.exports = {
      logger: {
        driver: 'file'
      }
    }`)

    const config = new Config(join(fs.basePath, 'config'))
    config.set('app.logger', { driver: 'memory' })
    assert.deepEqual(config.get('app.logger'), { driver: 'memory' })
  })

  test('raise error when config file has syntax errors', async (assert) => {
    assert.plan(2)

    await fs.add('config/app.js', `module.exports = {
      logger: {
        driver: 'file
      }
    }`)

    try {
      new Config(join(fs.basePath, 'config'))
    } catch ({ message, stack }) {
      assert.equal(message, 'Invalid or unexpected token')
      assert.isTrue(stack.split('\n')[0].endsWith('app.js:3'))
    }
  })

  test('merge defaults with existing user defaults', async (assert) => {
    await fs.add('config/app.js', `module.exports = {
      logger: {
        driver: 'file'
      }
    }`)

    const config = new Config(join(fs.basePath, 'config'))
    config.defaults('app.logger', { filePath: join(__dirname), driver: 'console' })

    assert.deepEqual(config.get('app.logger'), {
      filePath: join(__dirname),
      driver: 'file',
    })
  })

  test('merge defaults with existing user defaults when they are missing', async (assert) => {
    await fs.add('config/app.js', `module.exports = {}`)

    const config = new Config(join(fs.basePath, 'config'))
    config.defaults('app.logger', { filePath: join(__dirname) })

    assert.deepEqual(config.get('app.logger'), {
      filePath: join(__dirname),
    })
  })

  test('do not load d.ts files', async (assert) => {
    await fs.add('config/app.d.ts', `throw new Error('blow up')`)

    const config = () => new Config(join(fs.basePath, 'config'))
    assert.doesNotThrow(config)
  })
})
