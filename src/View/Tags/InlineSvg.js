'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')
const fs = require('fs')

module.exports = function (BaseTag) {
  return class InlineSvgTag extends BaseTag {
    constructor (publicPath) {
      super()
      this._publicPath = publicPath
    }

    /**
     * Returns absolute path to the file
     *
     * @method _getAbsPath
     *
     * @param  {String}    filePath
     *
     * @return {String}
     *
     * @private
     */
    _getAbsPath (filePath) {
      return path.isAbsolute(filePath) ? filePath : path.join(this._publicPath, filePath)
    }

    /**
     * Normalize the file path by prefixing svg to
     * it when it's missing
     *
     * @method _normalizePath
     *
     * @param  {String}       filePath
     *
     * @return {String}
     *
     * @private
     */
    _normalizePath (filePath) {
      return filePath.endsWith('.svg') ? filePath : `${filePath}.svg`
    }

    /**
     * The tag name
     *
     * @method tagName
     *
     * @return {String}
     */
    get tagName () {
      return 'inlineSvg'
    }

    /**
     * Tag is not a block tag
     *
     * @method isBlock
     *
     * @return {Boolean}
     */
    get isBlock () {
      return false
    }

    /**
     * List of allowed expressions
     *
     * @method allowedExpressions
     *
     * @return {Array}
     */
    get allowedExpressions () {
      return ['Literal']
    }

    /**
     * Compile method to fetch and set svg as part of
     * html
     *
     * @method compile
     *
     * @param  {Object} compiler
     * @param  {Object} lexer
     * @param  {Object} buffer
     * @param  {String} options.body
     * @param  {Array} options.childs
     * @param  {Number} options.lineno
     *
     * @return {void}
     */
    compile (compiler, lexer, buffer, { body, childs, lineno }) {
      body = body.replace(/\\/g, '/')
      const { value } = this._compileStatement(lexer, body, lineno)
      const svgFile = this._normalizePath(this._getAbsPath(value))

      try {
        buffer.writeToOutput(fs.readFileSync(svgFile, 'utf-8'), false)
      } catch (error) {
        error.lineno = lineno
        error.charno = 0
        throw error
      }
    }

    /**
     * Nothing needs to be done at runtime
     *
     * @method run
     */
    run () {}
  }
}
