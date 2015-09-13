'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Helpers = require('../../src/Helpers')
const chai = require('chai')
const expect = chai.expect
const path = require('path')

describe('Helpers', function () {
  it('should return an error when autoload is missing inside package.json file', function () {
    let fn = function () {
      return Helpers.load(path.join(__dirname, './helpers/invalid-package.json'))
    }
    expect(fn).to.throw(/autoload must be enable/)
  })

  it('should return an error when autoload values are missing inside package.json file', function () {
    let fn = function () {
      return Helpers.load(path.join(__dirname, './helpers/missing-package.json'))
    }
    expect(fn).to.throw(/autoload must be enable/)
  })

  it('should load package.json file when autoload is configured correctly', function () {
    Helpers.load(path.join(__dirname, './helpers/package.json'))
  })

  it('should return base path as application root', function () {
    expect(Helpers.basePath()).to.equal(path.join(__dirname, './helpers'))
  })

  it('should return path to application public directory', function () {
    expect(Helpers.publicPath()).to.equal(path.join(__dirname, './helpers/public'))
  })

  it('should return path to defined file inside application public directory', function () {
    expect(Helpers.publicPath('style.css')).to.equal(path.join(__dirname, './helpers/public/style.css'))
  })

  it('should return path to application app directory', function () {
    expect(Helpers.appPath()).to.equal(path.join(__dirname, './helpers/app'))
  })

  it('should return path to application storage directory', function () {
    expect(Helpers.storagePath()).to.equal(path.join(__dirname, './helpers/storage'))
  })

  it('should return path to define file inside application storage directory', function () {
    expect(Helpers.storagePath('database.sqlite')).to.equal(path.join(__dirname, './helpers/storage/database.sqlite'))
  })

  it('should return path to application views directory', function () {
    expect(Helpers.viewsPath()).to.equal(path.join(__dirname, './helpers/resources/views'))
  })

  it('should return path to application resources directory', function () {
    expect(Helpers.resourcesPath()).to.equal(path.join(__dirname, './helpers/resources'))
  })

  it('should return path to file defined inside application resources directory', function () {
    expect(Helpers.resourcesPath('views')).to.equal(path.join(__dirname, './helpers/resources/views'))
  })

  it('should return path to application config directory', function () {
    expect(Helpers.configPath()).to.equal(path.join(__dirname, './helpers/config'))
  })

  it('should return path to defined file inside application config directory', function () {
    expect(Helpers.configPath('database.js')).to.equal(path.join(__dirname, './helpers/config/database.js'))
  })

  it('should return application namespace', function () {
    expect(Helpers.appNameSpace()).to.equal('App')
  })

})
