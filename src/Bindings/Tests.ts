/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ContainerBindings } from '@ioc:Adonis/Core/Application'
import { CookieClientContract } from '@ioc:Adonis/Core/CookieClient'

/**
 * Define test bindings
 */
export function defineTestsBindings(
  ApiRequest: ContainerBindings['Japa/Preset/ApiRequest'],
  ApiClient: ContainerBindings['Japa/Preset/ApiClient'],
  CookieClient: CookieClientContract
) {
  /**
   * Serializing for parsing response cookies
   */
  ApiClient.cookiesSerializer({
    /**
     * The methods on the Request class encrypts and signs cookies.
     * Therefore, the prepare method returns the value as it is
     */
    prepare(_: string, value: any) {
      return value
    },

    /**
     * Process the server response and convert cookie value to a
     * plain string
     */
    process(key: string, value: any) {
      return CookieClient.parse(key, value)
    },
  })

  /**
   * Define cookie
   */
  ApiRequest.macro('cookie', function (key: string, value: any) {
    const signedValue = CookieClient.sign(key, value)
    if (signedValue) {
      this.cookiesJar[key] = { name: key, value: signedValue }
    }

    return this
  })

  /**
   * Define encrypted cookie
   */
  ApiRequest.macro('encryptedCookie', function (key: string, value: any) {
    const encryptedValue = CookieClient.encrypt(key, value)
    if (encryptedValue) {
      this.cookiesJar[key] = { name: key, value: encryptedValue }
    }

    return this
  })

  /**
   * Define plain cookie
   */
  ApiRequest.macro('plainCookie', function (key: string, value: any) {
    const encodedValue = CookieClient.encode(key, value)
    if (encodedValue) {
      this.cookiesJar[key] = { name: key, value: encodedValue }
    }

    return this
  })
}
