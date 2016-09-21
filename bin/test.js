'use strict'

const shell = require('shelljs')
const nodeVersion = process.version
let proxiesFlag = null

if (nodeVersion < 'v6.5.0') {
  proxiesFlag = '--harmony_proxies'
}

shell.exec('npm run lint')
shell.exec(`node ${proxiesFlag} ./node_modules/.bin/istanbul cover _mocha --report lcovonly -- -R spec test/unit test/acceptance && cat ./coverage/lcov.info | coveralls && rm -rf ./coverage`)