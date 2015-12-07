/* global describe, it */

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
  /**
   * expecting Helpers to throw error when package autoload is not 
   * defined inside package.json file
   */
  it('should return an error when autoload is missing inside package.json file', function () {
    let fn = function () {
      return Helpers.load(path.join(__dirname, './helpers/invalid-package.json'))
    }
    expect(fn).to.throw(/autoload must be enable/)
  })

  /**
   * expecting Helpers to throw error when package autoload is 
   * defined but values are missing inside package.json file
   */
  it('should return an error when autoload values are missing inside package.json file', function () {
    let fn = function () {
      return Helpers.load(path.join(__dirname, './helpers/missing-package.json'))
    }
    expect(fn).to.throw(/autoload must be enable/)
  })

  /**
   * When autoload is configured properly , do not throw error
   */
  it('should load package.json file when autoload is configured correctly', function () {
    Helpers.load(path.join(__dirname, './helpers/package.json'))
  })

  /**
   * testing basePath method expectations to make sure it returns 
   * root of the app
   */
  it('should return base path as application root', function () {
    expect(Helpers.basePath()).to.equal(path.join(__dirname, './helpers'))
  })

  /**
   * testing publicPath method expectations to make sure it returns 
   * public path for app
   */
  it('should return path to application public directory', function () {
    expect(Helpers.publicPath()).to.equal(path.join(__dirname, './helpers/public'))
  })

  /**
   * testing publicPath method expectations to make sure it returns 
   * path to the given file inside public directory
   */
  it('should return path to defined file inside application public directory', function () {
    expect(Helpers.publicPath('style.css')).to.equal(path.join(__dirname, './helpers/public/style.css'))
  })

  /**
   * testing appPath method expectations to make sure it returns 
   * app directory path
   */
  it('should return path to application app directory', function () {
    expect(Helpers.appPath()).to.equal(path.join(__dirname, './helpers/app'))
  })

  /**
   * testing storagePath method expectations to make sure it returns 
   * storage directory path
   */
  it('should return path to application storage directory', function () {
    expect(Helpers.storagePath()).to.equal(path.join(__dirname, './helpers/storage'))
  })

  /**
   * testing storagePath method expectations to make sure it returns 
   * link to file inside storage directory
   */
  it('should return path to define file inside application storage directory', function () {
    expect(Helpers.storagePath('database.sqlite')).to.equal(path.join(__dirname, './helpers/storage/database.sqlite'))
  })

  /**
   * testing viewsPath method expectations to make sure it returns 
   * path to views directory
   */
  it('should return path to application views directory', function () {
    expect(Helpers.viewsPath()).to.equal(path.join(__dirname, './helpers/resources/views'))
  })

  /**
   * testing resourcesPath method expectations to make sure it returns 
   * path to resources directory
   */
  it('should return path to application resources directory', function () {
    expect(Helpers.resourcesPath()).to.equal(path.join(__dirname, './helpers/resources'))
  })

  /**
   * testing resourcesPath method expectations to make sure it returns 
   * path to file inside resources directory
   */
  it('should return path to file defined inside application resources directory', function () {
    expect(Helpers.resourcesPath('views')).to.equal(path.join(__dirname, './helpers/resources/views'))
  })

  /**
   * testing configPath method expectations to make sure it returns 
   * path to config directory
   */
  it('should return path to application config directory', function () {
    expect(Helpers.configPath()).to.equal(path.join(__dirname, './helpers/config'))
  })

  /**
   * testing configPath method expectations to make sure it returns 
   * path to file inside config directory
   */
  it('should return path to defined file inside application config directory', function () {
    expect(Helpers.configPath('database.js')).to.equal(path.join(__dirname, './helpers/config/database.js'))
  })

  /**
   * testing appNameSpace method expectations to make sure it returns
   * application base Namespace
   */
  it('should return application namespace', function () {
    expect(Helpers.appNameSpace()).to.equal('App')
  })

  it('should encode base64 string', function () {
    expect(Helpers.base64Encode('Romain Lanz')).to.equal('Um9tYWluIExhbno=')
  })

  it('should decode base64 string', function () {
    expect(Helpers.base64Decode('Um9tYWluIExhbno=')).to.equal('Romain Lanz')
  })
})
