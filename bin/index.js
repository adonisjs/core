'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const semver = require('semver')
const { spawn } = require('child_process')
const harmonyFlag = semver.lt(process.version, '8.0.0') ? '--harmony-async-await' : ''

function local () {
  const tests = spawn('node', [harmonyFlag, './node_modules/.bin/japa'])
  tests.stdout.on('data', (data) => process.stdout.write(data))
  tests.stderr.on('data', (data) => process.stderr.write(data))
  tests.on('close', (code) => process.exit(code))
}

function win () {
  const tests = spawn('node', [harmonyFlag, './node_modules/japa-cli/index.js'])
  tests.stdout.on('data', (data) => process.stdout.write(data))
  tests.stderr.on('data', (data) => process.stderr.write(data))
  tests.on('close', (code) => process.exit(code))
}

if (process.argv.indexOf('--local') > -1) {
  local()
} else if (process.argv.indexOf('--win') > -1) {
  win()
}
