/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Static' {
  export type AssetsConfig = {
    enabled: boolean
    acceptRanges?: boolean
    cacheControl?: boolean
    dotFiles?: 'ignore' | 'allow' | 'deny'
    etag?: boolean
    lastModified?: boolean
    maxAge?: number | string
  }
}
