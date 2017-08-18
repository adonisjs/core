'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const bindings = exports = module.exports = {}

/**
 * Binds a fake hash mock to the Ioc container
 * for written tests.
 *
 * @method bindHashMock
 *
 * @param  {Object}     ioc
 *
 * @return {void}
 */
bindings.bindHashMock = function (ioc) {
  ioc.fake('Adonis/Src/Hash', () => require('../src/Hash/Mock'))
}
