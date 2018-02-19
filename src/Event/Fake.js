'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const GE = require('@adonisjs/generic-exceptions')

/**
 * Event fake is used to bind a fake implementation
 * of event emitter to IoC container
 *
 * @class EventFake
 * @constructor
 */
class EventFake {
  constructor () {
    this._emits = []
    this._traps = {}
  }

  /**
   * Fake for times
   *
   * @method times
   *
   * @chainable
   */
  times () {
    return this
  }

  /**
   * Add a callback to get the event data when it's
   * been fired
   *
   * @method trap
   *
   * @param  {String}   event
   * @param  {Function} callback
   *
   * @chainable
   */
  trap (event, callback) {
    if (typeof (callback) !== 'function') {
      GE.InvalidArgumentException.invalidParameter('Event.trap expects a callback', callback)
    }
    this._traps[event] = callback
    return this
  }

  /**
   * Stores the event details in memory to run assertions
   *
   * @method emit
   *
   * @param  {String}    event
   * @param  {...Spread} args
   *
   * @return {void}
   */
  emit (event, ...data) {
    if (this._traps[event]) {
      return this._traps[event](...data)
    }
    this._emits.push({ event, data })
  }

  /**
   * @alias this.emit
   */
  fire (...args) {
    this.emit(...args)
  }

  /**
   * Returns the last event.
   *
   * @method recent
   *
   * @return {Object}
   */
  recent () {
    return _.last(this._emits)
  }

  /**
   * Returns the last sent emitted event and removes
   * it from the store
   *
   * @method pullRecent
   *
   * @return {Object}
   */
  pullRecent () {
    return this._emits.pop()
  }

  /**
   * Pull x number of recent events from the store
   * and returns them in reverse order
   *
   * @method pullMany
   *
   * @return {Array}
   */
  pullMany (count) {
    const pulledEmits = _.size(this._emits) < count
      ? this._emits.splice(0)
      : this._emits.splice(_.size(this._emits) - count)
    return _.reverse(pulledEmits)
  }

  /**
   * Returns a copy of all the events
   *
   * @method all
   *
   * @return {Array}
   */
  all () {
    return _.clone(this._emits)
  }

  /**
   * Clear all stored events
   *
   * @method clear
   *
   * @return {void}
   */
  clear () {
    this._emits = []
    this._traps = {}
  }
}

module.exports = EventFake
