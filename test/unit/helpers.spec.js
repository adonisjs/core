'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const Helpers = require('../../src/Helpers')
const chai = require('chai')
const path = require('path')
const expect = chai.expect
const NE = require('node-exceptions')

const basePath = path.join(__dirname,'../acceptance');

describe("Helpers", function () {

  it('should throw error when autoload does exists in package file', function () {
    const fn = function () {
      Helpers.load(path.join(__dirname,'./package.test.json'))
    }
    expect(fn).to.throw(NE.DomainException, /autoload must be enable/)
  })

  it('should throw error when autoload exists but not configured', function () {
    const fn = function () {
      Helpers.load(path.join(__dirname,'./package.another.json'))
    }
    expect(fn).to.throw(NE.DomainException, /autoload must be enable/)
  })

  it('should set autoload values when Ioc instance is passed to load method', function () {
    let appKey, appNamesapce
    const Ioc = {
      autoload: function (namespace, key) {
        appKey = key
        appNamesapce = namespace
      }
    }
    Helpers.load(path.join(basePath,'./package.test.json'), Ioc)
    expect(appKey).to.equal(path.join(basePath, './app'))
    expect(appNamesapce).to.equal('App')
  })

  context('After Load', function () {
    before(function () {
      Helpers.load(path.join(basePath,'./package.test.json'))
    })
    it('should return project base directory path', function () {
      expect(Helpers.basePath()).to.equal(basePath)
    })

    it('should return project app directory path', function () {
      expect(Helpers.appPath()).to.equal(path.join(basePath,'./app'))
    })

    it('should return project public directory path', function () {
      expect(Helpers.publicPath()).to.equal(path.join(basePath,'./public'))
    })

    it('should return public path to a given file', function () {
      expect(Helpers.publicPath('style.css')).to.equal(path.join(basePath,'./public/style.css'))
    })

    it('should return project config directory path', function () {
      expect(Helpers.configPath()).to.equal(path.join(basePath,'./config'))
    })

    it('should return config path to a given file', function () {
      expect(Helpers.configPath('database.js')).to.equal(path.join(basePath,'./config/database.js'))
    })

    it('should return project storage directory path', function () {
      expect(Helpers.storagePath()).to.equal(path.join(basePath,'./storage'))
    })

    it('should return storage path to a given file', function () {
      expect(Helpers.storagePath('cache')).to.equal(path.join(basePath,'./storage/cache'))
    })

    it('should return project resources directory path', function () {
      expect(Helpers.resourcesPath()).to.equal(path.join(basePath,'./resources'))
    })

    it('should return resources path to a given file', function () {
      expect(Helpers.resourcesPath('views')).to.equal(path.join(basePath,'./resources/views'))
    })

    it('should return project migrations directory path', function () {
      expect(Helpers.migrationsPath()).to.equal(path.join(basePath,'./database/migrations'))
    })

    it('should return migrations path to a given file', function () {
      expect(Helpers.migrationsPath('1234.js')).to.equal(path.join(basePath,'./database/migrations/1234.js'))
    })

    it('should return project seeds directory path', function () {
      expect(Helpers.seedsPath()).to.equal(path.join(basePath,'./database/seeds'))
    })

    it('should return migrations path to a given file', function () {
      expect(Helpers.seedsPath('1234.js')).to.equal(path.join(basePath,'./database/seeds/1234.js'))
    })

    it('should return project factories directory path', function () {
      expect(Helpers.factoriesPath()).to.equal(path.join(basePath,'./database/factories'))
    })

    it('should return migrations path to a given file', function () {
      expect(Helpers.factoriesPath('1234.js')).to.equal(path.join(basePath,'./database/factories/1234.js'))
    })

    it('should return project views directory path', function () {
      expect(Helpers.viewsPath()).to.equal(path.join(basePath,'./resources/views'))
    })

    it('should make complete namespace for a given namespace', function () {
      const hook = Helpers.makeNameSpace('Model/Hooks', 'UserHook.validate')
      expect(hook).to.equal('App/Model/Hooks/UserHook.validate')
    })

    it('should return complete namespace when toPath is already a complete namespace', function () {
      const hook = Helpers.makeNameSpace('Model/Hooks', 'App/Model/Hooks/UserHook.validate')
      expect(hook).to.equal('App/Model/Hooks/UserHook.validate')
    })
  })
})
