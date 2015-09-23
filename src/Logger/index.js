'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const winston = require('winston')

/**
 * setting up logger instance
 */
let Logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      json: false,
      prefixes: 'adonis',
      prettyPrint: true,
      colorize: true
    })
  ]
})

/**
 * if --verbose flag have been passed while running script
 * than set level of logger to verbose
 */
if (process.argv.indexOf('--verbose') > -1) {
  Logger.level = 'verbose'
}

/**
 * if --silly flag have been passed while running script
 * than set level of logger to silly
 */
if (process.argv.indexOf('--silly') > -1) {
  Logger.level = 'silly'
}

exports = module.exports = Logger
