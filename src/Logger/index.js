'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Logger for adonis framework , mostly used
 *                by core components.
 */

// requiring dependencies
const log = require('captains-log')

/**
 * adonis specific theme for captains log
 * @type {Object}
 */
let loggerDefaults = {
  prefixThemes: {
    adonis: {
      silly: 'adonis-http-dispatcher:[silly] ',
      verbose: 'adonis-http-dispatcher:[verbose] ',
      info: 'adonis-http-dispatcher:[info] ',
      blank: 'adonis-http-dispatcher:',
      debug: 'adonis-http-dispatcher[debug] ',
      warn: 'adonis-http-dispatcher:[warn] ',
      error: 'adonis-http-dispatcher:[error] ',
      crit: 'adonis-http-dispatcher:[CRITICAL] '
    }
  },
  prefixTheme: 'adonis'
}

// exporting logger
let Logger = exports = module.exports = log(loggerDefaults)
