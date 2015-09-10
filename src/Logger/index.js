'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const log = require('captains-log')

/**
 * adonis specific theme for captains log
 * @private
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

exports = module.exports = log(loggerDefaults)
