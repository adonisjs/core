'use strict'

const Benchmark = require('benchmark')
const suite = new Benchmark.Suite
const requireDirectory = require('require-directory')
const autoLoad = require('auto-loader')
const path = require('path')
const dir = path.join(__dirname, '../src')

const loadViaReqDir = function () {
  return requireDirectory(module,dir)
}

const loadViaAutoLoad = function () {
  return autoLoad(dir)
}


suite.add('via require-directory', function  () {
  loadViaReqDir()
})
.add('via auto-load', function () {
  loadViaAutoLoad()
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
// run async
.run({ 'async': true });
