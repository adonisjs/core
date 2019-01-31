/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

type HookCallbackNode = () => void

export class Hooks {
  private _store: {
    providersRegistered: HookCallbackNode[],
    providersBooted: HookCallbackNode[],
    preloading: HookCallbackNode[],
    httpServer: HookCallbackNode[],
    aceCommand: HookCallbackNode[],
  } = {
    providersRegistered: [],
    providersBooted: [],
    preloading: [],
    httpServer: [],
    aceCommand: [],
  }

  public providersRegistered (callback: HookCallbackNode): this {
    this._store.providersRegistered.push(callback)
    return this
  }

  public providersBooted (callback: HookCallbackNode): this {
    this._store.providersBooted.push(callback)
    return this
  }

  public preloading (callback: HookCallbackNode): this {
    this._store.preloading.push(callback)
    return this
  }

  public httpServer (callback: HookCallbackNode): this {
    this._store.httpServer.push(callback)
    return this
  }

  public aceCommand (callback: HookCallbackNode): this {
    this._store.aceCommand.push(callback)
    return this
  }
}
