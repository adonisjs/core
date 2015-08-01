"use strict";


/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Extends error to generate http specefic errors.
 */


/**
 * [HttpException]
 * @constructor
 */
function HttpException() {
  Error.call(this);
  if (arguments.length == 2) {
    this.statusCode = arguments[0];
    this.message = arguments[1];
  } else {
    this.message = arguments[0];
  }
}

module.exports = HttpException;