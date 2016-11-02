'use strict'

const semver = require('semver')
const shell = require('shelljs')
const nodeJsVersion = process.version
let proxiesFlag = ''

if (semver.lt(nodeJsVersion, '6.0.0')) {
  proxiesFlag = '--harmony_proxies'
}

shell.exec(`DB=${process.env.DB} node ${proxiesFlag} ./node_modules/.bin/istanbul cover _mocha test/unit test/acceptance --bail`)
