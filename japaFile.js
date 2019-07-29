process.env.TS_NODE_FILES = true
require('ts-node/register')

const { configure } = require('japa')
configure({
  files: ['test/**/*.spec.ts']
})
