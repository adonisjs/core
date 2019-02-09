/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ProfilerContract, ProfilerConfig, ProfilerSubscriber, ProfilerRowContract } from '../Contracts'
import { ProfilerRow } from './Row'
import { DummyAction, DummyRow } from './Dummy'

/**
 * Profile exposes the public interface to create new profiling
 * rows and actions. In case of blacklisted actions, dummy
 * implementations are returned, resulting in noop.
 */
export class Profiler implements ProfilerContract {
  /**
   * Caching and using a single instance of dummy action and
   * row.
   */
  public dummyAction = new DummyAction()
  public dummyRow = new DummyRow(this)

  /**
   * Subscribe to listen for events
   */
  public subscriber: ProfilerSubscriber

  /**
   * Profiler config
   */
  private _config: ProfilerConfig

  constructor (config: Partial<ProfilerConfig>) {
    this._config = Object.assign({
      enabled: true,
      whitelist: [],
      blacklist: [],
    }, config)
  }

  /**
   * Returns a boolean telling if profiler is enabled for
   * a given `action` or `label` or not?
   */
  public isEnabled (labelOrAction: string): boolean {
    if (!this._config.enabled) {
      return false
    }

    /**
     * If white list is empty, then check for blacklist
     */
    if (this._config.whitelist.length === 0) {
      return this._config.blacklist.indexOf(labelOrAction) === -1
    }

    /**
     * Otherwise check for whitelist only. We can check for `whitelist` and
     * `blacklist` both here, but not 100% sure.
     */
    return this._config.whitelist.indexOf(labelOrAction) > -1
  }

  /**
   * Creates a new profiler row for a given action. If action is not enabled
   * then a copy of [[this.dummyRow]] is returned, which has the same
   * public API with all actions to a noop.
   */
  public create (label: string, data?: any): ProfilerRowContract {
    if (this.isEnabled(label)) {
      return new ProfilerRow(label, this, data)
    }

    return this.dummyRow
  }

  /**
   * Define subscriber for the profiler. Only one subscriber can be defined
   * at max. Redifying the subscriber will override the existing subscriber
   */
  public subscribe (fn: ProfilerSubscriber): void {
    this.subscriber = fn
  }
}
