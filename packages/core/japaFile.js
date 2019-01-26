require('ts-node/register')

const { configure } = require('japa')
configure({
  files: ['test/**/middleware.spec.ts']
})
