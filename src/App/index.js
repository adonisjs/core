'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const EventEmitter2 = require('eventemitter2').EventEmitter2

/**
 * App is an instance of event emitter. Adonis iternally
 * uses it to emit events like error and start.
 * @module App
 * @example
 * App.on('error', function () {})
 * App.emit('custom-event')
 */
exports = module.exports = new EventEmitter2()
