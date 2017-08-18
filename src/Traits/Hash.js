'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ioc } = require('@adonisjs/fold')

/**
 * Adds a fake hash class to the ioc container
 *
 * @method exports
 *
 * @param  {Object} suite
 *
 * @return {void}
 */
module.exports = function (suite) {
  suite.before(() => {
    ioc.fake('Adonis/Src/Hash', () => require('../Hash/Mock'))
  })
  suite.after(() => {
    ioc.restore('Adonis/Src/Hash')
  })
}
