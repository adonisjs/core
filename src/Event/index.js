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
const { resolver } = require('@adonisjs/fold')
const Resetable = require('resetable')
const EventEmitter = require('eventemitter2').EventEmitter2
const CE = require('../Exceptions')

class Event {
  constructor (Config) {
    this.emitter = new EventEmitter(Config.merge('app.events', {
      wildcard: true,
      delimiter: '::',
      newListener: false
    }))
    this._namespacedListeners = {}
    this._many = new Resetable(null)
  }

  /**
   * Resolves a listener via Ioc Container
   *
   * @method _resolveListener
   *
   * @param  {String|Function}         listener
   *
   * @return {Function}
   *
   * @private
   */
  _resolveListener (listener) {
    const { method } = resolver.forDir('listeners').resolveFunc(listener)
    if (typeof (listener) === 'string') {
      this._namespacedListeners[listener] = method
    }
    return method
  }

  /**
   * Returns a list of listeners registered
   * for an event
   *
   * @method getListeners
   *
   * @param  {String}  event
   *
   * @return {Array}
   */
  getListeners (event) {
    return this.emitter.listeners(event)
  }

  /**
   * Returns a boolean indicating whether an
   * event has listeners or not
   *
   * @method hasListeners
   *
   * @param  {String}     event
   *
   * @return {Boolean}
   */
  hasListeners (event) {
    return this.listenersCount(event) > 0
  }

  /**
   * Returns an array of listeners binded for any
   * event.
   *
   * @method listenersAny
   *
   * @return {Array}
   */
  getListenersAny () {
    return this.emitter.listenersAny()
  }

  /**
   * Returns a count of total listeners registered
   * for an event
   *
   * @method listenersCount
   *
   * @param  {String}       event
   *
   * @return {Number}
   */
  listenersCount (event) {
    return this.getListeners(event).length
  }

  /**
   * Bind a listener for an event
   *
   * @method when
   * @alias on
   *
   * @param  {String} event
   * @param  {Array|String|Function} listeners
   *
   * @return {void}
   */
  when (event, listeners) {
    this.on(event, listeners)
  }

  /**
   * Emits a event
   *
   * @method emit
   * @alias fire
   *
   * @param  {String}    event
   * @param  {Spread} args
   *
   * @return {void}
   */
  emit (event, ...args) {
    this.emitter.emit(event, ...args)
  }

  /**
   * Emit an event
   *
   * @method fire
   * @alias emit
   *
   * @param  {String}    event
   * @param  {Spread} args
   *
   * @return {void}
   */
  fire (event, ...args) {
    this.emit(event, ...args)
  }

  /**
   * Bind a listener only for x number of times
   *
   * @method times
   *
   * @param  {Number} number
   *
   * @chainable
   */
  times (number) {
    if (typeof (number) !== 'number') {
      throw CE.InvalidArgumentException.invalidParameter('Event.times expects a valid number', number)
    }
    this._many.set(number)
    return this
  }

  /**
   * Bind a listener for an event
   *
   * @method on
   * @alias when
   *
   * @param  {String} event
   * @param  {Array|String|Function} listeners
   *
   * @return {void}
   */
  on (event, listeners) {
    listeners = _.isArray(listeners) ? listeners : [listeners]
    const times = this._many.pull()
    _.each(listeners, (listener) => {
      if (times > 1) {
        this.emitter.many(event, times, this._resolveListener(listener))
      } else {
        this.emitter.on(event, this._resolveListener(listener))
      }
    })
  }

  /**
   * Bind listener for any event
   *
   * @method onAny
   * @alias any
   *
   * @param  {String|Function|Array} listeners
   *
   * @return {void}
   */
  onAny (listeners) {
    listeners = _.isArray(listeners) ? listeners : [listeners]
    _.each(listeners, (listener) => {
      this.emitter.onAny(this._resolveListener(listener))
    })
  }

  /**
   * Bind listener for any event
   *
   * @method any
   * @alias onAny
   *
   * @param  {String|Function|Array} listeners
   *
   * @return {void}
   */
  any (listeners) {
    this.onAny(listeners)
  }

  /**
   * Bind a listener only for one time
   *
   * @method once
   *
   * @param  {String} event
   * @param  {Array|Function|String} listeners
   *
   * @return {void}
   */
  once (event, listeners) {
    listeners = _.isArray(listeners) ? listeners : [listeners]
    _.each(listeners, (listener) => {
      this.emitter.once(event, this._resolveListener(listener))
    })
  }

  /**
   * Remove listener for a given event.
   *
   * @method off
   * @alias removeListener
   *
   * @param  {String} event
   * @param  {Function|Array|String} listeners
   *
   * @return {void}
   */
  off (event, listeners) {
    this.removeListener(event, listeners)
  }

  /**
   * Removes listeners binded for any event
   *
   * @method offAny
   *
   * @param  {Function|String|Array} listeners
   *
   * @return {void}
   */
  offAny (listeners) {
    listeners = _.isArray(listeners) ? listeners : [listeners]
    _.each(listeners, (listener) => {
      listener = typeof (listener) === 'string' ? this._namespacedListeners[listener] : listener
      this.emitter.offAny(listener)
    })
  }

  /**
   * Removes listener for a given event
   *
   * @method removeListener
   * @alias off
   *
   * @param  {String}       event
   * @param  {Function|String|Array}       listeners
   *
   * @return {void}
   */
  removeListener (event, listeners) {
    listeners = _.isArray(listeners) ? listeners : [listeners]
    _.each(listeners, (listener) => {
      listener = typeof (listener) === 'string' ? this._namespacedListeners[listener] : listener
      this.emitter.off(event, listener)
    })
  }

  /**
   * Removes all listeners for a given event
   *
   * @method removeAllListeners
   *
   * @param  {String}           event
   *
   * @return {void}
   */
  removeAllListeners (event) {
    this.emitter.removeAllListeners(event)
  }

  /**
   * Update max listeners which is set to 10
   *
   * @method setMaxListeners
   *
   * @param  {Number}        number
   */
  setMaxListeners (number) {
    if (typeof (number) !== 'number') {
      throw CE.InvalidArgumentException.invalidParameter('Event.setMaxListeners expects a valid number', number)
    }
    this.emitter.setMaxListeners(number)
  }
}

module.exports = Event
