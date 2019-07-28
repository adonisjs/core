/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as ms from 'ms'
import { makeUrl } from '@poppinss/http-server'
import { RouterContract } from '@ioc:Adonis/Core/Route'
import { EncryptionContract } from '@ioc:Adonis/Core/Encryption'

/**
 * Normalizes the url options to ensure it always has `qs` and
 * `params` object
 */
function normalizeOptions (options?: Partial<{ qs: any, params: any }>): { qs: any, params: any } {
  return Object.assign({ qs: {}, params: {} }, options)
}

/**
 * Extends the router by adding `makeUrl` and `makeSignedUrl` to it.
 */
export default function extendRouter (router: RouterContract, encryption: EncryptionContract) {
  /**
   * Makes a url for a given route using it's name, pattern or
   * the controller.method name. The routes with domain will
   * be returned as protocol relative urls
   */
  router.makeUrl = function makeRouteUrl (routeIdentifier, options?, domain?) {
    const route = router.lookup(routeIdentifier, domain)
    if (!route) {
      return null
    }

    const url = makeUrl(route.pattern, normalizeOptions(options))
    return route.domain !== 'root' ? `//${route.domain}${url}` : url
  }

  /**
   * Makes a signed url for a given route using it's name, pattern or
   * the controller.method name. The routes with domain will
   * be returned as protocol relative urls.
   *
   * Signed urls can be later verified using `request.hasValidSignature`
   * method.
   */
  router.makeSignedUrl = function makeSignedUrl (routeIdentifier: string, options?, domain?: string) {
    const route = router.lookup(routeIdentifier, domain)
    if (!route) {
      return null
    }

    const normalizedOptions = normalizeOptions(options)

    /**
     * Compute expiry date from the expires in value and put in as
     * a query string in the url.
     */
    const expiresIn = normalizedOptions['expiresIn']
    if (expiresIn) {
      const milliseconds = typeof (expiresIn) === 'string' ? ms(expiresIn) : expiresIn
      normalizedOptions.qs.expires_at = Date.now() + milliseconds
    }

    const signature = encryption
      .newInstance({ hmac: false })
      .encrypt(makeUrl(route.pattern, normalizedOptions))

    /**
     * Adding signature to the url
     */
    normalizedOptions.qs.signature = signature
    const url = makeUrl(route.pattern, normalizedOptions)
    return route.domain !== 'root' ? `//${route.domain}${url}` : url
  }
}
