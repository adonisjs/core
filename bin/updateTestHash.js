const { execSync } = require('child_process')
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const commit = execSync(`git rev-parse origin/"$(git rev-parse --abbrev-ref HEAD)"`).toString('utf-8').trim()
if (!commit) {
  console.log('UPDATE HASH: Cannot locate commit')
  return
}

const pkgFile = join(__dirname, '../package.json')
const cmd = `lerna run test --since ${commit}`
const matchFor = /"test":\s?"lerna run test(.*)"/
const pkgContents = readFileSync(pkgFile, 'utf-8').replace(matchFor, `"test": "${cmd}"`)

console.log(`UPDATE HASH: ${cmd}`)
writeFileSync(pkgFile, pkgContents)
