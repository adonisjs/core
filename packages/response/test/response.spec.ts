/*
 * @adonisjs/framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import * as supertest from 'supertest'
import { join } from 'path'
import { stat, outputFile, remove, ensureDir } from 'fs-extra'
import { createWriteStream, createReadStream } from 'fs'
import { createServer } from 'http'
import * as etag from 'etag'

import { Response } from '../src/Response'

const fakeConfig = (config?) => {
  return Object.assign({}, config)
}

const APP_ROOT = join(__dirname, 'app')

test.group('Response', (group) => {
  group.afterEach(async () => {
    await remove(APP_ROOT)
  })

  test('set http response headers', async () => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.header('status', 200)
      response.header('content-type', 'application/json')
      res.end()
    })

    await supertest(server).get('/').expect(200).expect('Content-Type', 'application/json')
  })

  test('get recently set headers', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.header('status', 200)
      response.header('content-type', 'application/json')
      res.end(JSON.stringify({ contentType: response.getHeader('Content-Type') }))
    })

    const { body } = await supertest(server).get('/').expect(200).expect('Content-Type', 'application/json')
    assert.deepEqual(body, {
      contentType: 'application/json',
    })
  })

  test('append header to existing header', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.header('set-cookie', 'username=virk')
      response.append('set-cookie', 'age=22')
      res.end()
    })

    const { headers } = await supertest(server).get('/')
    assert.deepEqual(headers['set-cookie'], ['username=virk', 'age=22'])
  })

  test('add header via append when header doesn\'t exists already', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.append('set-cookie', 'age=22')
      res.end()
    })

    const { headers } = await supertest(server).get('/')
    assert.deepEqual(headers['set-cookie'], ['age=22'])
  })

  test('append to the header value when it\'s an array', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.append('set-cookie', ['username=virk'])
      response.append('set-cookie', ['age=22'])
      res.end()
    })

    const { headers } = await supertest(server).get('/')
    assert.deepEqual(headers['set-cookie'], ['username=virk', 'age=22'])
  })

  test('do not set header when value is non-existy', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.header('set-cookie', '')
      res.end()
    })

    const { headers } = await supertest(server).get('/')
    assert.isUndefined(headers['set-cookie'])
  })

  test('do not set header when already exists', async () => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.header('content-type', 'application/json')
      response.safeHeader('content-type', 'text/html')
      res.end()
    })

    await supertest(server).get('/').expect('content-type', 'application/json')
  })

  test('remove existing response header', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.header('content-type', 'application/json')
      response.removeHeader('content-type')
      res.end()
    })

    const { headers } = await supertest(server).get('/')
    assert.notProperty(headers, 'content-type')
  })

  test('set HTTP status', async () => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.status(201)
      res.end()
    })

    await supertest(server).get('/').expect(201)
  })

  test('parse buffer and return correct response header', async () => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      const { type, body } = response.buildResponseBody(Buffer.from('hello'))
      response.header('content-type', type)
      res.write(body)
      res.end()
    })

    await supertest(server).get('/').expect('content-type', 'application/octet-stream')
  })

  test('parse string and return correct response header', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      const { type, body } = response.buildResponseBody('hello')
      response.header('content-type', type)
      res.write(body)
      res.end()
    })

    const { text } = await supertest(server).get('/').expect('content-type', 'text/plain')
    assert.equal(text, 'hello')
  })

  test('parse HTML string and return correct response header', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      const { type, body } = response.buildResponseBody('<p> hello </p>')
      response.header('content-type', type)
      res.write(body)
      res.end()
    })

    const { text } = await supertest(server).get('/').expect('content-type', 'text/html')
    assert.equal(text, '<p> hello </p>')
  })

  test('parse array and set correct response type', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      const { type, body } = response.buildResponseBody([1, 2])
      response.header('content-type', type)
      res.write(body)
      res.end()
    })

    const { body } = await supertest(server).get('/').expect('content-type', 'application/json')
    assert.deepEqual(body, [1, 2])
  })

  test('parse object and set correct response type', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      const { type, body } = response.buildResponseBody({ username: 'virk' })
      response.header('content-type', type)
      res.write(body)
      res.end()
    })

    const { body } = await supertest(server).get('/').expect('content-type', 'application/json')
    assert.deepEqual(body, { username: 'virk' })
  })

  test('return content type as null for empty string', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      const { type } = response.buildResponseBody('')
      res.write(type)
      res.end()
    })

    const { text } = await supertest(server).get('/')
    assert.deepEqual(text, 'null')
  })

  test('return content type as null for null', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      const { type } = response.buildResponseBody(null)
      res.write(type)
      res.end()
    })

    const { text } = await supertest(server).get('/')
    assert.deepEqual(text, 'null')
  })

  test('do not write send body and headers unless finish is called explicitly', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.explicitEnd = true
      response.send({ username: 'virk' })
      res.write('hello')
      res.end()
    })

    const { text } = await supertest(server).get('/')
    assert.equal(text, 'hello')
  })

  test('write send body and headers when finish is called explicitly', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.send({ username: 'virk' })
    })

    const { body } = await supertest(server)
      .get('/')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', '19')

    assert.deepEqual(body, { username: 'virk' })
  })

  test('write send body when implicit end is off', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.send({ username: 'virk' })
    })

    const { body } = await supertest(server)
      .get('/')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', '19')

    assert.deepEqual(body, { username: 'virk' })
  })

  test('do not write response twice if finish is called twice', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.explicitEnd = true
      response.json({ username: 'virk' })
      response.finish()
      response.finish()
    })

    const { body } = await supertest(server)
      .get('/')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', '19')

    assert.deepEqual(body, { username: 'virk' })
  })

  test('hasLazyBody must return true after send has been called', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      response.explicitEnd = true
      response.json({ username: 'virk' })
      res.end(String(response.hasLazyBody))
    })

    const { text } = await supertest(server).get('/')
    assert.equal(text, 'true')
  })

  test('write jsonp response', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.jsonp({ username: 'virk' })
    })

    const { text } = await supertest(server).get('/')

    const body = { username: 'virk' }
    assert.equal(text, `/**/ typeof callback === 'function' && callback(${JSON.stringify(body)});`)
  })

  test('write jsonp response immediately when explicitEnd is false', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.explicitEnd = false
      response.jsonp({ username: 'virk' })
    })

    const { text } = await supertest(server).get('/')

    const body = { username: 'virk' }
    assert.equal(text, `/**/ typeof callback === 'function' && callback(${JSON.stringify(body)});`)
  })

  test('use explicit value as callback name', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.jsonp({ username: 'virk' }, 'fn')
    })

    const { text } = await supertest(server).get('/?callback=cb')

    const body = { username: 'virk' }
    assert.equal(text, `/**/ typeof fn === 'function' && fn(${JSON.stringify(body)});`)
  })

  test('use config value when explicit value is not defined and their is no query string', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig({ jsonpCallbackName: 'cb' })
      const response = new Response(req, res, config)
      response.jsonp({ username: 'virk' })
    })

    const { text } = await supertest(server).get('/')

    const body = { username: 'virk' }
    assert.equal(text, `/**/ typeof cb === 'function' && cb(${JSON.stringify(body)});`)
  })

  test('stream response', async (assert) => {
    await outputFile(join(APP_ROOT, 'hello.txt'), 'hello world')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.stream(createReadStream(join(APP_ROOT, 'hello.txt')), true)
    })

    const { text } = await supertest(server).get('/')
    assert.equal(text, 'hello world')
  })

  test('raise error when input is not a stream', async (assert) => {
    assert.plan(1)

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      try {
        const stream = response.stream as any
        stream('hello', true)
      } catch ({ message }) {
        assert.equal(message, 'response.stream accepts a readable stream only')
        res.end()
      }
    })

    await supertest(server).get('/')
  })

  test('raise error when input is not a readable stream', async (assert) => {
    assert.plan(1)
    await ensureDir(APP_ROOT)

    const server = createServer(async (req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      const writeStream = createWriteStream(join(APP_ROOT, 'hello.txt'))

      try {
        const stream = response.stream as any
        await stream(writeStream, true)
      } catch ({ message }) {
        assert.equal(message, 'response.stream accepts a readable stream only')
        writeStream.close()
        res.end()
      }
    })

    await supertest(server).get('/')
  })

  test('should not hit the maxListeners when making more than 10 calls', async () => {
    await outputFile(join(APP_ROOT, 'hello.txt'), 'hello world')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.stream(createReadStream(join(APP_ROOT, 'hello.txt')), true)
    })

    const requests = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(() => supertest(server).get('/').expect(200))
    await Promise.all(requests)
  })

  test('should not hit the maxListeners when making more than 10 calls with errors', async () => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response
        .stream(createReadStream(join(APP_ROOT, 'hello.txt')), true)
        .catch((error) => {
          res.end(error.message)
        })
    })

    const requests = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(() => supertest(server).get('/'))
    await Promise.all(requests)
  })

  test('raise error when stream raises one', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response
        .stream(createReadStream(join(APP_ROOT, 'hello.txt')), true)
        .catch((error) => {
          res.end(error.code)
        })
    })

    const { text } = await supertest(server).get('/')
    assert.oneOf(text, ['ENOENT', 'EPERM'])
  })

  test('send stream errors vs raising them', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.stream(createReadStream(join(APP_ROOT, 'hello.txt')))
    })

    const { text } = await supertest(server).get('/')
    assert.oneOf(text, ['File not found', 'Cannot process file'])
  })

  test('download file with correct content type', async (assert) => {
    await outputFile(join(APP_ROOT, 'hello.html'), '<p> hello world </p>')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.download(join(APP_ROOT, 'hello.html'))
    })

    const { text } = await supertest(server)
      .get('/')
      .expect('Content-type', 'text/html; charset=utf-8')
      .expect('Content-length', '20')

    assert.equal(text, '<p> hello world </p>')
  })

  test('write errors as response when downloading folder', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.download(join(APP_ROOT))
    })

    const { text } = await supertest(server).get('/').expect(404)
    assert.equal(text, 'Cannot process file')
  })

  test('write errors as response when file is missing', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.download(join(APP_ROOT, 'hello.html'))
    })

    const { text } = await supertest(server).get('/').expect(404)
    assert.equal(text, 'Cannot process file')
  })

  test('raise errors as response when file is missing', async (assert) => {
    const server = createServer(async (req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      try {
        await response.download(join(APP_ROOT, 'hello.html'), false, true)
      } catch (error) {
        res.writeHead(404)
        res.end('Custom error during file processing')
      }
    })

    const { text } = await supertest(server).get('/').expect(404)
    assert.equal(text, 'Custom error during file processing')
  })

  test('do not stream file on HEAD calls', async (assert) => {
    await outputFile(join(APP_ROOT, 'hello.html'), '<p> hello world </p>')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.download(join(APP_ROOT, 'hello.html'))
    })

    const { text } = await supertest(server).head('/').expect(200)
    assert.isUndefined(text)
  })

  test('do not stream file when cache is fresh', async (assert) => {
    await outputFile(join(APP_ROOT, 'hello.html'), '<p> hello world </p>')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.download(join(APP_ROOT, 'hello.html'), true)
    })

    const stats = await stat(join(APP_ROOT, 'hello.html'))

    const { text } = await supertest(server)
      .get('/')
      .set('if-none-match', etag(stats, { weak: true }))
      .expect(304)

    assert.equal(text, '')
  })

  test('set HTTP status to 304 when cache is fresh and request is HEAD', async (assert) => {
    await outputFile(join(APP_ROOT, 'hello.html'), '<p> hello world </p>')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.download(join(APP_ROOT, 'hello.html'), true)
    })

    const stats = await stat(join(APP_ROOT, 'hello.html'))

    const { text } = await supertest(server)
      .head('/')
      .set('if-none-match', etag(stats, { weak: true }))
      .expect(304)

    assert.isUndefined(text)
  })

  test('download file with correct content disposition', async (assert) => {
    await outputFile(join(APP_ROOT, 'hello.html'), '<p> hello world </p>')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.attachment(join(APP_ROOT, 'hello.html'))
    })

    const { text } = await supertest(server)
      .get('/')
      .expect('Content-type', 'text/html; charset=utf-8')
      .expect('Content-length', '20')
      .expect('Content-Disposition', 'attachment; filename="hello.html"')

    assert.equal(text, '<p> hello world </p>')
  })

  test('download file with custom file name', async (assert) => {
    await outputFile(join(APP_ROOT, 'hello.html'), '<p> hello world </p>')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.attachment(join(APP_ROOT, 'hello.html'), 'ooo.html')
    })

    const { text } = await supertest(server)
      .get('/')
      .expect('Content-type', 'text/html; charset=utf-8')
      .expect('Content-length', '20')
      .expect('Content-Disposition', 'attachment; filename="ooo.html"')

    assert.equal(text, '<p> hello world </p>')
  })

  test('download file with custom disposition', async (assert) => {
    await outputFile(join(APP_ROOT, 'hello.html'), '<p> hello world </p>')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.attachment(join(APP_ROOT, 'hello.html'), 'ooo.html', 'inline')
    })

    const { text } = await supertest(server)
      .get('/')
      .expect('Content-type', 'text/html; charset=utf-8')
      .expect('Content-length', '20')
      .expect('Content-Disposition', 'inline; filename="ooo.html"')

    assert.equal(text, '<p> hello world </p>')
  })

  test('redirect to given url', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.redirect('/foo')
    })

    const { headers } = await supertest(server).get('/').redirects(1)
    assert.equal(headers.location, '/foo')
  })

  test('redirect to given url with query string', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.redirect('/foo', true)
    })

    const { headers } = await supertest(server).get('/?username=virk').redirects(1)
    assert.equal(headers.location, '/foo?username=virk')
  })

  test('redirect to given url and set custom statusCode', async () => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.redirect('/foo', false, 301)
    })

    await supertest(server).get('/').redirects(1).expect(301)
  })

  test('add multiple vary fields', async () => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.vary('Origin')
      response.vary('Set-Cookie')
      res.end()
    })

    await supertest(server).get('/').expect('Vary', 'Origin, Set-Cookie')
  })

  test('set status code to 204 when body is empty', async () => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.send('')
    })

    await supertest(server).get('/').expect(204)
  })

  test('remove previously set content headers when status code is 304', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.header('Content-type', 'application/json')
      response.status(204)
      response.send({ username: 'virk' })
    })

    const { headers } = await supertest(server).get('/').expect(204)
    assert.isUndefined(headers['content-type'])
  })

  test('generate etag when set to true', async () => {
    const server = createServer((req, res) => {
      const config = fakeConfig({
        etag: true,
      })
      const response = new Response(req, res, config)
      response.send({ username: 'virk' })
    })

    const responseEtag = etag(JSON.stringify({ username: 'virk' }))
    await supertest(server).get('/').expect('Etag', responseEtag)
  })

  test('convert number to string when sending as response', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.send(22)
    })

    const { text } = await supertest(server).get('/')
    assert.equal(text, '22')
  })

  test('convert boolean to string when sending as response', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.send(true)
    })

    const { text } = await supertest(server).get('/')
    assert.equal(text, 'true')
  })

  test('raise error when return type is not valid', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)

      try {
        response.send(function foo () {})
      } catch (error) {
        res.write(error.message)
        res.end()
      }
    })

    const { text } = await supertest(server).get('/')
    assert.equal(text, 'Cannot send function as HTTP response')
  })

  test('convert serializable objects to JSON representation', async (assert) => {
    class User {
      public toJSON () {
        return {
          username: 'virk',
        }
      }
    }

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.send(new User())
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, { username: 'virk' })
  })

  test('send response as 200 when request method is HEAD and cache is not fresh', async (assert) => {
    await outputFile(join(APP_ROOT, 'hello.html'), '<p> hello world </p>')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.download(join(APP_ROOT, 'hello.html'), true)
    })

    const { text } = await supertest(server)
      .head('/')
      .set('if-none-match', 'hello')
      .expect(200)

    assert.isUndefined(text)
  })

  test('stream the file when request method is GET and cache is not fresh', async (assert) => {
    await outputFile(join(APP_ROOT, 'hello.html'), '<p> hello world </p>')

    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.download(join(APP_ROOT, 'hello.html'), true)
    })

    const { text } = await supertest(server)
      .get('/')
      .set('if-none-match', 'hello')
      .expect(200)

    assert.equal(text, '<p> hello world </p>')
  })

  test('set response type with custom charset', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig()
      const response = new Response(req, res, config)
      response.type('plain/text', 'ascii').send('done')
    })

    const { text } = await supertest(server)
      .get('/')
      .expect(200)
      .expect('content-type', 'plain/text; charset=ascii')

    assert.equal(text, 'done')
  })
})
