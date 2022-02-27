/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IncomingMessage } from 'http'
import { Assert } from 'japa/build/src/Assert'

import { CorsConfig } from '@ioc:Adonis/Core/Cors'
const corsConfig = {
  enabled: true,
  origin: true,
  methods: ['GET', 'PUT', 'POST'],
  headers: true,
  credentials: true,
  maxAge: 90,
  exposeHeaders: [],
}

const CORS_HEADERS = [
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-expose-headers',
  'access-control-allow-headers',
  'access-control-allow-methods',
  'access-control-max-age',
]

/**
 * Fixtures that tests the cors functionality as
 * per https://www.w3.org/TR/cors/ RFC.
 */
export const specFixtures = [
  {
    title: 'do not set any headers when origin is not defined',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig)
    },

    configureRequest() {},

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'do not set any headers when origin mis-matches',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: 'adonisjs.com',
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'foo.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'do not set any headers when all origins are dis-allowed',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: false,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'foo.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'do not set headers when origin case sensitive match fails',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: 'foo.com',
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'FOO.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: "do not set headers when current origin isn't inside array of allowed origins",

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: ['foo.com'],
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'bar.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'allow all origins when origin is set to true',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'foo.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'allow origin when current origin is in allowed array list',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: ['foo.com', 'bar.com'],
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'foo.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'allow origin when current origin is in allowed comma seperated list',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: 'foo.com,bar.com',
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'foo.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'allow origin when config function returns true',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: () => true,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'foo.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'set current origin when using wildcard identifier with credentails=true',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: '*',
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'foo.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
      assert.equal(res.headers['access-control-allow-origin'], 'foo.com')
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'set wildcard when using wildcard identifier with credentails=false',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: '*',
        credentials: false,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'foo.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return key !== 'access-control-allow-origin'
        })
      )
      assert.equal(res.headers['access-control-allow-origin'], '*')
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'set expose headers when defined',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: '*',
        exposeHeaders: ['X-Adonis'],
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'foo.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            [
              'access-control-allow-origin',
              'access-control-allow-credentials',
              'access-control-expose-headers',
            ].indexOf(key) === -1
          )
        })
      )

      assert.equal(res.headers['access-control-allow-origin'], 'foo.com')
      assert.equal(res.headers['access-control-expose-headers'], 'x-adonis')
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'set required preflight headers when request method exists',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return ['access-control-expose-headers'].indexOf(key) > -1
        })
      )
    },
  },
  {
    title: "do not set preflight headers when request method isn't allowed",

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'DELETE',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'do not set preflight headers when all of the request headers are not allowed',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
        headers: false,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'X-Adonis',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'do not set preflight headers when any of the request headers are not allowed',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
        headers: ['cache-control'],
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'X-Adonis',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
  {
    title: 'set preflight headers when all of the request headers are allowed',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
        headers: true,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'X-Adonis',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return ['access-control-expose-headers'].indexOf(key) > -1
        })
      )

      assert.equal(res.headers['access-control-allow-headers'], 'x-adonis')
    },
  },
  {
    title: 'set preflight headers when request headers is in the list of allowed headers',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
        headers: ['X-Adonis'],
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'X-Adonis',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return ['access-control-expose-headers'].indexOf(key) > -1
        })
      )

      assert.equal(res.headers['access-control-allow-headers'], 'x-adonis')
    },
  },
  {
    title: 'set preflight headers when request headers is in the list of comma seperated list',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
        headers: 'X-Adonis,X-Time',
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'origin,X-Adonis',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return ['access-control-expose-headers'].indexOf(key) > -1
        })
      )

      assert.equal(res.headers['access-control-allow-headers'], 'x-adonis,x-time')
    },
  },
  {
    title: 'set preflight headers when case insensitive match passes',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
        headers: ['x-adonis'],
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'X-Adonis',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return ['access-control-expose-headers'].indexOf(key) > -1
        })
      )

      assert.equal(res.headers['access-control-allow-headers'], 'x-adonis')
    },
  },
  {
    title: 'set all allow headers when request header match passes',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
        headers: ['x-adonis', 'x-foo', 'x-bar'],
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'X-Adonis',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return ['access-control-expose-headers'].indexOf(key) > -1
        })
      )

      assert.equal(res.headers['access-control-allow-headers'], 'x-adonis,x-foo,x-bar')
    },
  },
  {
    title: 'set allow headers when headers config function returns true',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
        headers: () => true,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'X-Adonis',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return ['access-control-expose-headers'].indexOf(key) > -1
        })
      )

      assert.equal(res.headers['access-control-allow-headers'], 'x-adonis')
    },
  },
  {
    title: 'set max age when defined',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
        headers: () => true,
        maxAge: 10,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'X-Adonis',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            ['access-control-allow-origin', 'access-control-allow-credentials'].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return ['access-control-expose-headers'].indexOf(key) > -1
        })
      )

      assert.equal(res.headers['access-control-max-age'], '10')
    },
  },
  {
    title: 'set expose headers when defined',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        origin: true,
        headers: () => true,
        exposeHeaders: ['x-response-time'],
        maxAge: 10,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        'origin': 'foo.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'X-Adonis',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(
        res.headers,
        CORS_HEADERS.filter((key) => {
          return (
            [
              'access-control-allow-origin',
              'access-control-allow-credentials',
              'access-control-expose-headers',
            ].indexOf(key) === -1
          )
        })
      )
    },

    assertOptions(assert: Assert, res: any) {
      assert.properties(res.headers, CORS_HEADERS)
      assert.equal(res.headers['access-control-expose-headers'], 'x-response-time')
    },
  },
  {
    title: 'do not set any headers when cors is disabled',

    configureOptions(): CorsConfig {
      return Object.assign({}, corsConfig, {
        enabled: false,
      })
    },

    configureRequest(req: IncomingMessage) {
      req.headers = {
        origin: 'foo.com',
      }
    },

    assertNormal(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },

    assertOptions(assert: Assert, res: any) {
      assert.notAnyProperties(res.headers, CORS_HEADERS)
    },
  },
]
