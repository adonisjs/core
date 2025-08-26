/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.ts'
import type { SignedUrlBuilderService, UrlBuilderService } from '../src/types.ts'

let urlFor: UrlBuilderService
let signedUrlFor: SignedUrlBuilderService

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
