'use strict'

/*
 * adonis-fold
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const ioc = new (require('./src/Ioc'))()
const ServiceProvider = require('./src/ServiceProvider')
const registrar = new (require('./src/Registrar'))(ioc)
const resolver = new (require('./src/Resolver/Manager'))(ioc)

global.use = ioc.use.bind(ioc)
global.make = ioc.make.bind(ioc)
global.iocResolver = resolver

module.exports = { ioc, ServiceProvider, registrar, resolver }
