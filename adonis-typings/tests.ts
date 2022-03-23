/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import '@japa/api-client'
declare module '@japa/api-client' {
  export interface ApiRequest {
    encryptedCookie(key: string, value: any): this
    plainCookie(key: string, value: any): this
  }
}
