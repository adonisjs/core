/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.ts'
import type { UrlBuilderSignedUrlFor, UrlBuilderUrlFor } from '../src/types.ts'

let urlFor: UrlBuilderUrlFor
let signedUrlFor: UrlBuilderSignedUrlFor

/**
 * Returns a singleton instance of the router class from
 * the container
 */
await app.booted(async () => {
  const router = await app.container.make('router')
  urlFor = router.urlBuilder.urlFor
  signedUrlFor = router.urlBuilder.signedUrlFor
})

export { urlFor, signedUrlFor }
