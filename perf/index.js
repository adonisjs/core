const Benchmark = require('benchmark')
const suite = new Benchmark.Suite()

const { Ioc } = require('..')
const ioc = new Ioc()
const ioc1 = new Ioc(true)

function bind (container) {
  container.bind('App/Config', () => {
    return 'config'
  })

  container.bind('App/Logger', () => {
    return 'logger'
  })

  container.bind('App/Server', (app) => {
    return `${app.use('App/Config')}-${app.use('App/Logger')}`
  })
}

bind(ioc)
bind(ioc1)

suite.add('No emitter', function() {
  ioc.use('App/Server')
  ioc.use('App/Config')
  ioc.use('App/Logger')
})
.add('Emitter', function() {
  ioc1.use('App/Server')
  ioc1.use('App/Config')
  ioc1.use('App/Logger')
})
.on('cycle', function(event) {
  console.log(String(event.target))
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'))
})
.run({ 'async': true })
