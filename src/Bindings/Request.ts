/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { stringify } from 'querystring'
import { RequestContract } from '@poppinss/request'
import { EncryptionContract } from '@ioc:Adonis/Core/Encryption'
import { RequestConstructorContract } from '@ioc:Adonis/Core/Request'

/**
 * Extends the router by adding `makeUrl` and `makeSignedUrl` to it.
 */
export default function extendRequest (Request: RequestConstructorContract, encryption: EncryptionContract) {
  Request.macro('hasValidSignature', function hasValidSignature (this: RequestContract) {
    const { signature, ...rest } = this.get()
    if (!signature) {
      return false
    }

    /**
     * Return false when signature fails
     */
    const signedUrl = encryption.decrypt(signature)
    if (!signedUrl) {
      return false
    }

    /**
     * Return false when expires_at exists and is over the
     * current time
     */
    if (rest.expires_at && Number(rest.expires_at) < Date.now()) {
      return false
    }

    /**
     * Finally verify the decrypted token
     */
    const query = stringify(rest)
    return signedUrl === (query ? `${this.url()}?${query}` : this.url())
  })
}
