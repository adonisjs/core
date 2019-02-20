/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as test from 'japa'
import { join } from 'path'
import { createServer } from 'http'
import * as supertest from 'supertest'

import { Multipart } from '../src/Multipart'
import { File } from '../src/Multipart/File'

const PACKAGE_FILE_PATH = join(__dirname, '../package.json')

test.group('File', () => {
  test('use part data to set file metadata', async (assert) => {
    const server = createServer(async (req, res) => {
      let file: File | null = null

      const multipart = new Multipart(req)
      multipart.onFile('package', async (p) => {
        file = new File({
          fileName: p.filename,
          fieldName: p.name,
          headers: p.headers,
          bytes: 100,
          tmpPath: 'fake.json',
        })

        p.resume()
      })

      await multipart.process()

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({
        fieldName: file!.fieldName,
        clientName: file!.clientName,
        size: file!.size,
        tmpPath: file!.tmpPath,
        extname: file!.extname,
        status: file!.status,
        type: file!.type,
        subtype: file!.subtype,
      }))
    })

    const { body } = await supertest(server).post('/').attach('package', PACKAGE_FILE_PATH)
    assert.deepEqual(body, {
      clientName: 'package.json',
      fieldName: 'package',
      size: 100,
      tmpPath: 'fake.json',
      extname: 'json',
      status: 'pending',
      subtype: 'json',
      type: 'application',
    })
  })

  test('return isValid to true, when there are no validations in place', async (assert) => {
    const server = createServer(async (req, res) => {
      let file: File | null = null

      const multipart = new Multipart(req)
      multipart.onFile('package', async (p) => {
        file = new File({
          fileName: p.filename,
          fieldName: p.name,
          headers: p.headers,
          bytes: 100,
          tmpPath: 'fake.json',
        })

        p.resume()
      })

      await multipart.process()

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ isValid: file!.isValid, status: file!.status }))
    })

    const { body } = await supertest(server).post('/').attach('package', PACKAGE_FILE_PATH)
    assert.deepEqual(body, { isValid: true, status: 'pending' })
  })

  test('validate ext with validation options are set', async (assert) => {
    const server = createServer(async (req, res) => {
      let file: File | null = null

      const multipart = new Multipart(req)
      multipart.onFile('package', async (p) => {
        file = new File({
          fileName: p.filename,
          fieldName: p.name,
          headers: p.headers,
          bytes: 100,
          tmpPath: 'fake.json',
        })

        file.setValidationOptions({
          extnames: ['jpg'],
        })

        p.resume()
      })

      await multipart.process()

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({
        isValid: file!.isValid,
        errors: file!.errors,
        status: file!.status,
      }))
    })

    const { body } = await supertest(server).post('/').attach('package', PACKAGE_FILE_PATH)
    assert.deepEqual(body, {
      isValid: false,
      errors: [{
        fieldName: 'package',
        clientName: 'package.json',
        message: 'Invalid file extension json. Only jpg is allowed',
        type: 'extname',
      }],
      status: 'error',
    })
  })

  test('validate size with validation options are set', async (assert) => {
    const server = createServer(async (req, res) => {
      let file: File | null = null

      const multipart = new Multipart(req)
      multipart.onFile('package', async (p) => {
        file = new File({
          fileName: p.filename,
          fieldName: p.name,
          headers: p.headers,
          bytes: 100,
          tmpPath: 'fake.json',
        })

        file.setValidationOptions({
          size: 1,
        })

        p.resume()
      })

      await multipart.process()

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({
        isValid: file!.isValid,
        errors: file!.errors,
        status: file!.status,
      }))
    })

    const { body } = await supertest(server).post('/').attach('package', PACKAGE_FILE_PATH)
    assert.deepEqual(body, {
      isValid: false,
      errors: [{
        fieldName: 'package',
        clientName: 'package.json',
        message: 'File size should be less than 100B',
        type: 'size',
      }],
      status: 'error',
    })
  })
})
