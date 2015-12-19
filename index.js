'use strict'

/**
 * adonis-fold
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Ioc = require('./src/Ioc')
const ServiceProvider = require('./src/ServiceProvider')
const Registrar = require('./src/Registrar')

GLOBAL.use = Ioc.use
GLOBAL.make = Ioc.make

module.exports = { Ioc, ServiceProvider, Registrar }
