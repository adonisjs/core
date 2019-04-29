/*
* @adonisjs/framework
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { Exception } from '@adonisjs/utils'
import * as SimpleEncryptor from 'simple-encryptor'
import { exceptionCodes } from '../../lib'
import { EncryptionContract, EncryptionConfig } from '../Contracts/Encryption'

/**
 * Encryption class uses `AES-256` to encrypt raw values using `Objects`,
 * `Arrays` and even `Date` objects. When `hmac=true`, an HMAC is
 * generated with `sha256` encryption.
 */
export class Encryption implements EncryptionContract {
  /**
   * Simple encryptor .d.ts files are broken and hence we need
   * to cast it to any at the time of usage
   */
  private _encryptor: any

  constructor (private _secret: string, private _options?: Partial<EncryptionConfig>) {
    if (!this._secret) {
      throw new Exception('Define appKey inside config/app file', 500, exceptionCodes.E_MISSING_APP_KEY)
    }

    this._encryptor = (SimpleEncryptor as any)(Object.assign({
      key: this._secret,
      debug: false,
      hmac: false,
    }, this._options))
  }

  /**
   * Encrypts value with `AES-256` encryption. HMAC is disabled by default for
   * returning shorter output. Feel free to grab a [[newInstance]] of the
   * encryption class with `hmac=true`.
   */
  public encrypt (payload: any): string {
    return this._encryptor.encrypt(payload)
  }

  /**
   * Decrypt existing encrypted value. Returns `null`, when unable to
   * decrypt.
   */
  public decrypt (payload: string): any {
    return this._encryptor.decrypt(payload)
  }

  /**
   * Returns a custom instance of [[Encryption]] class with custom
   * configuration
   */
  public newInstance (options?: Partial<EncryptionConfig>): Encryption {
    return new Encryption(this._secret, options)
  }

  /**
   * Base64 encode Buffer or string
   */
  public base64Encode (arrayBuffer: ArrayBuffer | SharedArrayBuffer): string
  public base64Encode (data: string, encoding?: BufferEncoding): string
  public base64Encode (
    data: ArrayBuffer | SharedArrayBuffer | string,
    encoding?: BufferEncoding,
  ): string {
    if (typeof (data) === 'string') {
      return Buffer.from(data, encoding).toString('base64')
    }
    return Buffer.from(data).toString('base64')
  }

  /**
   * Base64 decode a previously encoded string or Buffer.
   */
  public base64Decode (encoded: string | Buffer, encoding: BufferEncoding = 'utf-8'): string {
    return Buffer.isBuffer(encoded)
      ? encoded.toString(encoding)
      : Buffer.from(encoded, 'base64').toString(encoding)
  }
}
