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
export interface IocContract {
  autoloads: { [namespace: string]: string },
  autoloadedAliases: string[],
  bind (name: string, callback: BindCallback): void
  singleton (name: string, callback: BindCallback): void
  alias (namespace: string, alias: string): void
  autoload (directoryPath: string, namespace: string): void
  clearAutoloadCache (namespace?: string, clearRequireCache?: boolean): void
  fake (name: string, callback: BindCallback): void
  use<T extends any = any> (name: string, relativeFrom?: string): T
  make<T extends any = any> (name: string, relativeFrom?: string): T
  useFake<T extends any = any> (name: string): T
  hasFake (name: string): boolean
  hasAlias (name: string): boolean
  hasBinding (namespace: string, checkAliases?: boolean): boolean
  getAliasNamespace (name: string): string | undefined
  isAutoloadNamespace (namespace: string): boolean
  getAutoloadBaseNamespace (namespace: string): string | undefined
  restore (name: string): void
  with (namespaces: string[], cb: (...args: any[]) => void): void
}

export type BindCallback = (app: IocContract) => unknown
