/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/
/// <reference path="../adonis-typings/index.ts" />

import * as test from 'japa'
import { createServer } from 'http'
import * as supertest from 'supertest'
import { Request } from '@poppinss/request'
import { Router } from '@poppinss/http-server'
import { RouterContract } from '@ioc:Adonis/Core/Route'
import { RequestContract } from '@ioc:Adonis/Core/Request'

import { Encryption } from '../src/Encryption'
import extendRouter from '../src/Bindings/Route'
import extendRequest from '../src/Bindings/Request'

const requestConfig = {
  secret: Math.random().toFixed(36).substring(2, 38),
  subdomainOffset: 2,
  generateRequestId: false,
  allowMethodSpoofing: false,
  trustProxy: require('proxy-addr'),
}

test.group('Verify signed url', () => {
  test('verify signed url', async (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', async function handler () {})
    router.commit()

    const encryption = new Encryption(requestConfig.secret)
    extendRouter(router, encryption)
    extendRequest(Request, encryption)

    const server = createServer((req, res) => {
      const request = new Request(req, res, requestConfig) as unknown as RequestContract
      res.end(String(request.hasValidSignature()))
    })

    const url = router.makeSignedUrl('/posts/:id', { params: { id: 1 } })!
    const { text } = await supertest(server).get(url)
    assert.equal(text, 'true')
  })

  test('verify signed url with query string', async (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', async function handler () {})
    router.commit()

    const encryption = new Encryption(requestConfig.secret)
    extendRouter(router, encryption)
    extendRequest(Request, encryption)

    const server = createServer((req, res) => {
      const request = new Request(req, res, requestConfig) as unknown as RequestContract
      res.end(String(request.hasValidSignature()))
    })

    const url = router.makeSignedUrl('/posts/:id', { params: { id: 1 }, qs: { name: 'virk' } })!
    const { text } = await supertest(server).get(url)
    assert.equal(text, 'true')
  })

  test('verify signed url with expiry', async (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', async function handler () {})
    router.commit()

    const encryption = new Encryption(requestConfig.secret)
    extendRouter(router, encryption)
    extendRequest(Request, encryption)

    const server = createServer((req, res) => {
      const request = new Request(req, res, requestConfig) as unknown as RequestContract
      res.end(String(request.hasValidSignature()))
    })

    const url = router.makeSignedUrl('/posts/:id', {
      params: { id: 1 },
      qs: { name: 'virk' },
      expiresIn: '1m',
    })!

    const { text } = await supertest(server).get(url)
    assert.equal(text, 'true')
  })

  test('return false when signature is expired', async (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', async function handler () {})
    router.commit()

    const encryption = new Encryption(requestConfig.secret)
    extendRouter(router, encryption)
    extendRequest(Request, encryption)

    const server = createServer((req, res) => {
      const request = new Request(req, res, requestConfig) as unknown as RequestContract
      res.end(String(request.hasValidSignature()))
    })

    const url = router.makeSignedUrl('/posts/:id', {
      params: { id: 1 },
      qs: { name: 'virk' },
      expiresIn: -10,
    })!

    const { text } = await supertest(server).get(url)
    assert.equal(text, 'false')
  })
})
