'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

// importing libs
const EventEmitter2 = require('eventemitter2').EventEmitter2

// exporting app as part of event emitter
exports = module.exports = new EventEmitter2()
