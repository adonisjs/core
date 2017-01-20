'use strict'

/*
 * adonis-fold
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Ioc = new (require('./src/Ioc'))()
const ServiceProvider = require('./src/ServiceProvider')
const Registrar = new (require('./src/Registrar'))(Ioc)

global.use = Ioc.use.bind(Ioc)
global.make = Ioc.make.bind(Ioc)

module.exports = { Ioc, ServiceProvider, Registrar }
