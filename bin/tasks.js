'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const exec = require('shelljs').exec
const ygor = require('ygor')
const path = require('path')

const BIN = 'node --harmony-async-await'
const COVERALLS_BIN = './node_modules/.bin/coveralls'
const COVERAGE_DIR = `${path.join(__dirname, '../coverage')}`
const COVERAGE_FILE = `${path.join(COVERAGE_DIR, 'lcov.info')}`

/**
 * Runs test safely without knowing the required
 * harmony flags. This command should be consumed
 * internally.
 */
ygor.task('test:safe', () => {
  require('require-all')({
    dirname: path.join(__dirname, '../test/unit'),
    filter: /(.+spec)\.js$/
  })
})

/**
 * Runs test suite by adding the harmony async/await
 * flag.
 */
ygor.task('test:local', () => {
  exec(`FORCE_COLOR=true ${BIN} bin/tasks.js test:safe`)
})

/**
 * Same as test:local, but leaving space if any future
 * customizations are required on windows. Also we
 * will rely on travis to report coverage report
 * to coveralls.
 */
ygor.task('test:win', () => {
  exec(`FORCE_COLOR=true ${BIN} bin/tasks.js test:safe`)
})

/**
 * Same as test local, instead it will report the
 * coverage info to coveralls. You may need to pass
 * SECRETS for coveralls account, but it's better
 * to let Travis do that for you.
 */
ygor.task('test', () => {
  exec(`FORCE_COLOR=true ${BIN} bin/tasks.js test:safe && cat ${COVERAGE_FILE} | ${COVERALLS_BIN} && rm -rf ${COVERAGE_DIR}`)
})

/**
 * Runs test and reports coverage to a local
 * directory to be viewed by the developer.
 */
ygor.task('coverage', () => {
  exec(`FORCE_COLOR=true ${BIN} ./node_modules/.bin/istanbul cover --hook-run-in-context -x bin/tasks.js bin/tasks.js test:safe`)
})
