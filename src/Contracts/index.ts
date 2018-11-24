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

/**
 * IIOC container interface
 */
export interface IIoC {
  es6Imports: boolean,
  bind (name: string, callback: IBindCallback): void
  singleton (name: string, callback: IBindCallback): void
  alias (namespace: string, alias: string): void
  autoload (directoryPath: string, namespace: string): void
  clearAutoloadCache (namespace?: string, clearRequireCache?: boolean): void
  fake (name: string, callback: IBindCallback): void
  use<T> (name: string, relativeFrom?: string): T
  make<T> (name: string, relativeFrom?: string): T
  useFake<T> (name: string): T
  hasFake (name: string): boolean
  hasAlias (name: string): boolean
  hasBinding (namespace: string, checkAliases?: boolean): boolean
  getAliasNamespace (name: string): string | undefined
  isAutoloadNamespace (namespace: string): boolean
  getAutoloadBaseNamespace (namespace: string): string | undefined
  restore (name: string): void
  with (namespaces: string[], cb: (...args: any[]) => void): void
}

/**
 * Service provider interface
 */
export interface IServiceProvider {
  app: IIoC
  register? (): void
  boot? (): void
}

/**
 * Shape of binding stored inside the IoC container
 */
export type IBinding = {
  callback: IBindCallback,
  singleton: boolean,
  cachedValue?: unknown,
}

/**
 * Shape of autoloaded cache entry
 */
export type IAutoloadCacheItem = {
  diskPath: string,
  cachedValue: any,
}

export type IBindCallback = (app: IIoC) => unknown
