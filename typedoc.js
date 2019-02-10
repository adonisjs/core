module.exports = function (config) {
  return Object.assign({
    tsconfig: 'tsconfig.json',
    exclude: [
      'test/*.ts',
      'example/*.ts',
      'lib/*.ts',
      'test-helpers/*.ts'
    ],
    mode: 'modules',
    excludeExternals: true,
    excludeNotExported: true
  }, config)
}
