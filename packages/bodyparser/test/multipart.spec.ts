/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as test from 'japa'
import { createServer } from 'http'
import * as supertest from 'supertest'
import { join } from 'path'
import { pathExists, remove } from 'fs-extra'
import { createWriteStream } from 'fs'

import { Multipart } from '../src/Multipart'
import { MultipartStream } from '../src/Contracts'

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

const PACKAGE_FILE_PATH = join(__dirname, '../package.json')

test.group('Multipart', () => {
  test('process file by attaching handler on field name', async (assert) => {
    let part: null | MultipartStream = null

    const server = createServer(async (req, res) => {
      const multipart = new Multipart(req)
      multipart.onFile('package', async (p) => {
        part = p
        part.resume()
      })
      await multipart.process()
      res.end()
    })

    await supertest(server).post('/').attach('package', PACKAGE_FILE_PATH)

    assert.equal(part!.name, 'package')
    assert.equal(part!.filename, 'package.json')
    assert.isTrue(part!['_readableState'].ended)
  })

  test('error inside onFile handler should propogate to main process', async (assert) => {
    let part: null | MultipartStream = null

    const server = createServer(async (req, res) => {
      const multipart = new Multipart(req)
      multipart.onFile('package', async () => {
        throw new Error('Cannot process')
      })

      try {
        await multipart.process()
        res.end()
      } catch (error) {
        res.writeHead(500)
        res.end(error.message)
      }
    })

    const { text } = await supertest(server).post('/').attach('package', PACKAGE_FILE_PATH)

    assert.isNull(part)
    assert.equal(text, 'Cannot process')
  })

  test('wait for promise to return even when part has been streamed', async (assert) => {
    const stack: string[] = []

    const server = createServer(async (req, res) => {
      const multipart = new Multipart(req)
      multipart.onFile('package', async (part) => {
        stack.push('before')
        part.resume()
        await sleep(100)
        stack.push('after')
      })

      await multipart.process()
      stack.push('ended')
      res.end()
    })

    await supertest(server).post('/').attach('package', PACKAGE_FILE_PATH)
    assert.deepEqual(stack, ['before', 'after', 'ended'])
  })

  test('work fine when stream is piped to a destination', async (assert) => {
    const SAMPLE_FILE_PATH = join(__dirname, './sample.json')

    const server = createServer(async (req, res) => {
      const multipart = new Multipart(req)

      multipart.onFile('package', async (part) => {
        part.pipe(createWriteStream(SAMPLE_FILE_PATH))
      })
      await multipart.process()

      const hasFile = await pathExists(SAMPLE_FILE_PATH)
      res.end(String(hasFile))
    })

    const { text } = await supertest(server).post('/').attach('package', PACKAGE_FILE_PATH)

    assert.equal(text, 'true')
    await remove(SAMPLE_FILE_PATH)
  })

  test('work fine with array of files', async (assert) => {
    const stack: string[] = []

    const server = createServer(async (req, res) => {
      const multipart = new Multipart(req)
      multipart.onFile('package', async (part) => {
        stack.push('before')
        part.resume()
        await sleep(100)
        stack.push('after')
      })

      await multipart.process()
      stack.push('ended')
      res.end()
    })

    await supertest(server).post('/').attach('package[]', PACKAGE_FILE_PATH)
    assert.deepEqual(stack, ['before', 'after', 'ended'])
  })

  test('work fine with indexed array of files', async (assert) => {
    const stack: string[] = []

    const server = createServer(async (req, res) => {
      const multipart = new Multipart(req)
      multipart.onFile('package', async (part) => {
        stack.push('before')
        part.resume()
        await sleep(100)
        stack.push('after')
      })

      await multipart.process()
      stack.push('ended')
      res.end()
    })

    await supertest(server).post('/').attach('package[0]', PACKAGE_FILE_PATH)
    assert.deepEqual(stack, ['before', 'after', 'ended'])
  })

  test('pass file to wildcard handler when defined', async (assert) => {
    const stack: string[] = []

    const server = createServer(async (req, res) => {
      const multipart = new Multipart(req)
      multipart.onFile('*', async (part) => {
        stack.push('before')
        part.resume()
        await sleep(100)
        stack.push('after')
      })

      await multipart.process()
      stack.push('ended')
      res.end()
    })

    await supertest(server).post('/').attach('package', PACKAGE_FILE_PATH)
    assert.deepEqual(stack, ['before', 'after', 'ended'])
  })

  test('get fields from the fields handler', async (assert) => {
    const stack: string[] = []
    assert.plan(3)

    const server = createServer(async (req, res) => {
      const multipart = new Multipart(req)
      multipart.onFile('*', async (part) => {
        stack.push('file')
        part.resume()
      })

      multipart.onField('name', (key, value) => {
        assert.equal(key, 'name')
        assert.equal(value, 'virk')
        stack.push('field')
      })

      await multipart.process()
      stack.push('ended')
      res.end()
    })

    await supertest(server)
      .post('/')
      .attach('package', PACKAGE_FILE_PATH)
      .field('name', 'virk')

      assert.deepEqual(stack, ['file', 'field', 'ended'])
  })

  test('pass errors from field handler to upstream', async (assert) => {
    const server = createServer(async (req, res) => {
      const multipart = new Multipart(req)
      multipart.onField('name', () => {
        throw new Error('bad name')
      })

      try {
        await multipart.process()
        res.end()
      } catch (error) {
        res.writeHead(500)
        res.end(error.message)
      }
    })

    const { text } = await supertest(server)
      .post('/')
      .attach('package', PACKAGE_FILE_PATH)
      .field('name', 'virk')

    assert.equal(text, 'bad name')
  })

  test('raise error when process is invoked multipart times', async (assert) => {
    const server = createServer(async (req, res) => {
      const multipart = new Multipart(req)
      try {
        await multipart.process()
        await multipart.process()
        res.end()
      } catch (error) {
        res.writeHead(500)
        res.end(error.message)
      }
    })

    const { text } = await supertest(server)
      .post('/')
      .field('name', 'virk')

    assert.equal(text, 'E_CONSUMED_MULTIPART_STREAM: multipart stream has already been consumed')
  })
})
