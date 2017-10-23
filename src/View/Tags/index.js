'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const InlineSvgFactory = require('./InlineSvg')

module.exports = function (View, Helpers) {
  const InlineSvg = InlineSvgFactory(View.engine.BaseTag)
  View.tag(new InlineSvg(Helpers.publicPath()))
}
