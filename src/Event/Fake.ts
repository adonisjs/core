/**
 * @module Core
 */

/**
 * @adonisjs/framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
 */

import _ from 'lodash'
import GE from '@adonisjs/generic-exceptions'

class EventFake {
  /**
   * Fake events emitted.
   */
  private _emits: object[] = []

  /**
   * Handler of fake events.
   */
  private _traps: object = {}

  /**
   * Fake for times.
   */
  public times (): this {
    return this
  }

  /**
   * Add a callback to get the event data when it's
   * been fired.
   *
   * @param  event      Event to register
   * @param  callback   Handler
   */
  public trap (event: string, callback: Function): this {
    if (typeof (callback) !== 'function') {
      GE.InvalidArgumentException.invalidParameter('Event.trap expects a callback', callback)
    }
    this._traps[event] = callback
    return this
  }

  /**
   * Stores the event details in memory to run assertions.
   *
   * @param  event  Name of the event
   * @param  data   Data to use for the callback
   */
  public emit (event: string, ...data: any[]): void {
    if (this._traps[event]) {
      return this._traps[event](...data)
    }
    this._emits.push({ event, data })
  }

  /**
   * Stores the event details in memory to run assertions.
   *
   * @param  event  Name of the event
   * @param  data   Data to use for the callback
   */
  public fire (event: string, data: any[]): void {
    this.emit(event, data)
  }

  /**
   * Returns the latest event.
   */
  public recent (): object | undefined {
    return _.last(this._emits)
  }

  /**
   * Returns the last sent emitted event and removes
   * it from the store
   */
  public pullRecent (): object | undefined {
    return this._emits.pop()
  }

  /**
   * Pull x number of recent events from the store
   * and returns them in reverse order.
   *
   * @param  count  Number of event to pull
   */
  public pullMany (count: number): object[] {
    const pulledEmits = _.size(this._emits) < count
      ? this._emits.splice(0)
      : this._emits.splice(_.size(this._emits) - count)
    return _.reverse(pulledEmits)
  }

  /**
   * Returns a copy of all the events.
   */
  public all (): object[] {
    return _.clone(this._emits)
  }

  /**
   * Clear all stored events.
   */
  clear (): void {
    this._emits = []
    this._traps = {}
  }
}

export { EventFake }
