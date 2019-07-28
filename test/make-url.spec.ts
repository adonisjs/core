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
import { parse } from 'querystring'
import { RouterContract } from '@ioc:Adonis/Core/Route'
import { Router } from '@poppinss/http-server'
import { Encryption } from '../src/Encryption'
import extendRouter from '../src/Bindings/Route'

test.group('Make url', () => {
  test('make url to a given route', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', async function handler () {})
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeUrl('/posts/:id', { params: { id: 1 } })!
    assert.equal(url, '/posts/1')
  })

  test('make url to a given route by it\'s name', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', async function handler () {}).as('showPost')
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeUrl('showPost', { params: { id: 1 } })!
    assert.equal(url, '/posts/1')
  })

  test('make url to a given route by it\'s controller method', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', 'PostsController.index').as('showPost')
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeUrl('PostsController.index', { params: { id: 1 } })!
    assert.equal(url, '/posts/1')
  })

  test('make url to a given route by and append domain to it', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', 'PostsController.index').domain('blog.adonisjs.com')
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeUrl('PostsController.index', { params: { id: 1 } })
    assert.equal(url, '//blog.adonisjs.com/posts/1')
  })
})

test.group('Make signed url', () => {
  test('make signed url to a given route', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', async function handler () {})
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeSignedUrl('/posts/:id', { params: { id: 1 } })!
    const qs = parse(url.split('?')[1])
    assert.equal(encryption.decrypt(qs.signature as string), '/posts/1')
  })

  test('make signed url to a given route by it\'s name', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', async function handler () {}).as('showPost')
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeSignedUrl('showPost', { params: { id: 1 } })!
    const qs = parse(url.split('?')[1])
    assert.equal(encryption.decrypt(qs.signature as string), '/posts/1')
  })

  test('make signed url to a given route by it\'s controller method', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', 'PostsController.index').as('showPost')
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeSignedUrl('PostsController.index', { params: { id: 1 } })!
    const qs = parse(url.split('?')[1])
    assert.equal(encryption.decrypt(qs.signature as string), '/posts/1')
  })

  test('make signed url to a given route by and append domain to it', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', 'PostsController.index').domain('blog.adonisjs.com')
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeSignedUrl('PostsController.index', { params: { id: 1 } })!
    const qs = parse(url.split('?')[1])
    assert.equal(encryption.decrypt(qs.signature as string), '/posts/1')
  })

  test('make signed url with expiry', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', 'PostsController.index')
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeSignedUrl('PostsController.index', { params: { id: 1 }, expiresIn: '1m' })!
    const qs = parse(url.split('?')[1])

    const timestamp = Date.now() + 1000 * 60 * 60
    assert.equal(encryption.decrypt(qs.signature as string), `/posts/1?expires_at=${Number(qs.expires_at)}`)
    assert.isBelow(Number(qs.expires_at), timestamp)
  })

  test('make signed url with custom query string', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', 'PostsController.index')
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeSignedUrl('PostsController.index', {
      params: { id: 1 },
      qs: { page: 1 },
      expiresIn: '1m',
    })!
    const qs = parse(url.split('?')[1])

    const timestamp = Date.now() + 1000 * 60 * 60
    assert.equal(
      encryption.decrypt(qs.signature as string),
      `/posts/1?page=1&expires_at=${Number(qs.expires_at)}`,
    )
    assert.isBelow(Number(qs.expires_at), timestamp)
    assert.equal(Number(qs.page), 1)
  })

  test('make signed url with domain', (assert) => {
    const router = new Router() as unknown as RouterContract
    router.get('posts/:id', 'PostsController.index').domain('blog.adonisjs.com')
    router.commit()

    const encryption = new Encryption(Math.random().toFixed(36).substring(2, 38))
    extendRouter(router, encryption)

    const url = router.makeSignedUrl('PostsController.index', {
      params: { id: 1 },
      qs: { page: 1 },
      expiresIn: '1m',
    })!
    const qs = parse(url.split('?')[1])

    const timestamp = Date.now() + 1000 * 60 * 60
    assert.equal(
      encryption.decrypt(qs.signature as string),
      `/posts/1?page=1&expires_at=${Number(qs.expires_at)}`,
    )
    assert.isBelow(Number(qs.expires_at), timestamp)
    assert.equal(Number(qs.page), 1)
  })
})
