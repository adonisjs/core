process.env.TS_NODE_COMPILER_OPTIONS = '{ "removeComments": false }'
require('ts-node/register')

const { configure } = require('japa')
configure({
  files: ['test/**/*.spec.ts']
})
