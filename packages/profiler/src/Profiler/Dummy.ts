/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ProfilerRowContract, ProfilerActionContract, ProfilerContract } from '../Contracts'

/**
 * Dummy action is a noop implementation of [[ProfileActionContract]]. When
 * actions for certain labels are disabled, then dummy action is used and
 * helps in avoiding the need of unneccessary `if/else` clauses.
 */
export class DummyAction implements ProfilerActionContract {
  public end () {}
}

/**
 * Dummy row is a noop implementation of [[ProfilerRowContract]]. When certain
 * labels are disabled, then dummy row is used and helps in avoiding the need
 * of unneccessary `if/else` clauses.
 */
export class DummyRow implements ProfilerRowContract {
  constructor (private _manager: ProfilerContract) {
  }

  public get hasParent () {
    return false
  }

  public profile (): DummyAction {
    return this._manager.dummyAction
  }

  public child () {
    return this._manager.dummyRow
  }

  public end () {
  }
}
