'use strict'

/**
 * adonis-fold
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Ioc = require('./src/Ioc')
const ServiceProvider = require('./src/ServiceProvider')
const Registrar = require('./src/Registrar')

global.use = Ioc.use
global.make = Ioc.make

module.exports = { Ioc, ServiceProvider, Registrar }
