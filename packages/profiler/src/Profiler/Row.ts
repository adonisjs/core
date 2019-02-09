/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@adonisjs/utils'
import * as uniqid from 'uniqid'
import { ProfilerAction } from './Action'
import { ProfilerRowDataPacket, ProfilerRowContract, ProfilerContract, ProfilerActionContract } from '../Contracts'

/**
 * Profiler row class is used to group profiling actions together. Any
 * number of nested rows can be created.
 */
export class ProfilerRow implements ProfilerRowContract {
  private _id = uniqid()
  private _timestamp = Date.now()
  private _start = process.hrtime()
  private _ended = false

  constructor (
    private _label: string,
    private _manager: ProfilerContract,
    private _data?: any,
    private _parentId?: string,
  ) {}

  /**
   * Makes the log packet for the log row
   */
  private _makeLogPacket (): ProfilerRowDataPacket {
    return {
      id: this._id,
      type: 'row',
      label: this._label,
      parent_id: this._parentId,
      timestamp: this._timestamp,
      data: this._data || {},
      duration: process.hrtime(this._start),
    }
  }

  /**
   * Returns a boolean telling if a parent exists
   */
  public get hasParent () {
    return !!this._parentId
  }

  /**
   * Get a new profile action instance. Make sure to call
   * `end` on the action instance for the log to appear.
   */
  public profile (action: string, data?: any): ProfilerActionContract {
    if (this._manager.isEnabled(action)) {
      return new ProfilerAction(this._id, action, this._manager.subscriber, data)
    }

    return this._manager.dummyAction
  }

  /**
   * End the profiler instance by emitting end lop packet. After
   * this all profiling calls will be considered overflows
   */
  public end (data?: any) {
    if (!this._manager.subscriber) {
      return
    }

    /**
     * Raise error when end has been called already
     */
    if (this._ended) {
      throw new Exception('attempt to end profiler row twice')
    }

    /**
     * Setting end to true to avoid multiple calls
     */
    this._ended = true

    if (data) {
      this._data = Object.assign({}, this._data, data)
    }

    this._manager.subscriber(this._makeLogPacket())
  }

  /**
   * Get a new child logger. Child logger will emit a new row
   * in the events timeline
   */
  public child (label: string, data?: any): ProfilerRowContract {
    if (this._manager.isEnabled(label)) {
      return new ProfilerRow(label, this._manager, data, this._id)
    }

    return this._manager.dummyRow
  }
}
