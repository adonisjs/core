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
      silly: 'adonis:[silly] ',
      verbose: 'adonis:[verbose] ',
      info: 'adonis:[info] ',
      blank: 'adonis:',
      debug: 'adonis:[debug] ',
      warn: 'adonis:[warn] ',
      error: 'adonis:[error] ',
      crit: 'adonis:[CRITICAL] '
    }
  },
  prefixTheme: 'adonis'
}

// exporting logger
exports = module.exports = log(loggerDefaults)
