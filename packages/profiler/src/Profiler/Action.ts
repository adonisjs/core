/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@adonisjs/utils'
import { ProfilerActionDataPacket, ProfilerSubscriber } from '../Contracts'

/**
 * Profiler action is used to profile the timing of a given action. An
 * action is always connected to a row, so it is recommended to
 * get the instance of action using [[ProfilerRow]].
 */
export class ProfilerAction {
  private _start = process.hrtime()
  private _timestamp = Date.now()
  private _ended = false

  constructor (
    private _rowId: string,
    private _action: string,
    private _subscriber?: ProfilerSubscriber,
    private _data?: any,
  ) {}

  /**
   * Make packet for the action
   */
  private _makePacket (): ProfilerActionDataPacket {
    return {
      row_id: this._rowId,
      type: 'action',
      action: this._action,
      timestamp: this._timestamp,
      duration: process.hrtime(this._start),
      data: this._data || {},
    }
  }

  /**
   * End profiling action.
   */
  public end (data?: any) {
    if (!this._subscriber) {
      return
    }

    /**
     * Raise error when end is called twice. Their are high probabilities of
     * end getting called twice
     */
    if (this._ended) {
      throw new Exception('attempt to end profiler action twice')
    }

    /**
     * Set the flag
     */
    this._ended = true

    if (data) {
      this._data = Object.assign({}, this._data, data)
    }

    this._subscriber(this._makePacket())
  }
}
