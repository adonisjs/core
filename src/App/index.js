"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-http-dispatcher
 * @description - Event emitter for adonis app
 */


// importing libs
const EventEmitter2 = require("eventemitter2").EventEmitter2;

// exporting app as part of event emitter
let App = exports = module.exports = new EventEmitter2();