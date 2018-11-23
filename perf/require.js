const Benchmark = require('benchmark')
const suite = new Benchmark.Suite()

const { Ioc } = require('..')
const ioc = new Ioc()

/**
 * Bind require as a singleton to IoC container
 */
ioc.singleton('foo', function () {
  return require('./foo')
})

suite
.add('Ioc use', () => ioc.use('foo'))       /** IoC container */
.add('require', () => require('./foo'))     /** Require */
.on('cycle', function (event) {
  console.log(String(event.target))
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'))
})
.run({ 'async': true })
