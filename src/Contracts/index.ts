/**
 * @module main
 */

/*
* @adonisjs/fold
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

export interface IIoC {
  bind (name: string, callback: IBindCallback): void
  singleton (name: string, callback: IBindCallback): void
  fake (name: string, callback: IBindCallback): void
  use<T> (name: string): T
  useFake<T> (name: string): T
  hasFake (name: string): boolean
}

export type IBinding = {
  callback: IBindCallback,
  singleton: boolean,
  cachedValue?: unknown,
}

export type IAutoloadCacheItem = {
  diskPath: string,
  cachedValue: any,
}

export type IBindCallback = (app: IIoC) => unknown
