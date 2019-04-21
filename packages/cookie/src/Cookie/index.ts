/*
 * @adonisjs/cookie
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as cookie from 'cookie'
import * as cookieSignature from 'cookie-signature'
import { CookieOptions } from '../Contracts'

/**
 * Pack a value to be saved as a cookie string. If `secretKey` is
 * defined, then cookie will be signed to avoid client side
 * tampering
 */
export function pack (value: any, secretKey?: string): null | string {
  if (value === undefined || value === null) {
    return null
  }

  if (value instanceof Date) {
    value = value.toJSON()
  } else if (typeof (value) !== 'string') {
    value = `j:${JSON.stringify(value)}`
  }

  /**
   * If secret is defined, then sign the cookie
   */
  if (secretKey) {
    return `s:${cookieSignature.sign(value, secretKey)}`
  }

  return value
}

/**
 * Unpack, previously packed cookie value. If cookie was signed and `secretKey` is
 * not passed to this method, then the signed value will be returned as a plain
 * cookie.
 */
export function unpack (value: string, secretKey?: string): null | { value: any, signed: boolean } {
  let signed = false

  /**
   * Unsign signed cookie values. The cookie builder
   * prepends `s:` in front of signed cookies
   */
  if (value.substr(0, 2) === 's:' && secretKey) {
    signed = true
    value = cookieSignature.unsign(value.slice(2), secretKey)
  }

  /**
   * Return early when unable to unsign cookie
   */
  if (!value) {
    return null
  }

  /**
   * Parse JSON cookies using `JSON.parse`. The cookie builder
   * prepends `j:` to non string values.
   */
  if (value.substr(0, 2) === 'j:') {
    try {
      return {
        value: JSON.parse(value.slice(2)),
        signed,
      }
    } catch (error) {
      return null
    }
  }

  return { value, signed }
}

/**
 * Parse cookie header and return an object of cookies as `key/value` pair.
 *
 * The output has two top level nodes with `signedCookies` and `plainCookies`.
 */
export function parse (
  cookieHeader: string,
  secretKey?: string,
): { signedCookies: { [key: string]: any }, plainCookies: { [key: string]: any } } {
  const output = { signedCookies: {}, plainCookies: {} }
  if (!cookieHeader) {
    return output
  }

  const parsed = cookie.parse(cookieHeader)

  return Object.keys(parsed).reduce((result, key: string) => {
    const unpacked = unpack(parsed[key], secretKey)
    if (unpacked === null) {
      return result
    }

    if (unpacked.signed) {
      result.signedCookies[key] = unpacked.value
    } else {
      result.plainCookies[key] = unpacked.value
    }

    return result
  }, output)
}

/**
 * Serializes a key/value pair to a string, which is supposed
 * to be set as `Set-Cookie` header value.
 */
export function serialize (
  key: string,
  value: any,
  secretKey?: string,
  options?: Partial<CookieOptions>,
): string | null {
  const packedValue = pack(value, secretKey)
  if (packedValue === null) {
    return null
  }

  return cookie.serialize(key, packedValue, options)
}
