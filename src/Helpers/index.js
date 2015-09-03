'use strict'

let rootPath = null
let appPath = null
let appNameSpace = null

const path = require('path')

let Helpers = exports = module.exports = {}

Helpers.load = function(packagePath){
  rootPath = path.dirname(packagePath)
  const packageFile = require(packagePath)
  if(!packageFile.autoload){
    throw new Error('autoload must be enable inside package.json file')
  }
  const autoloadSettings = Object.keys(packageFile.autoload)
  if(!autoloadSettings.length){
    throw new Error('autoload must be enable inside package.json file')
  }
  appNameSpace = autoloadSettings[0]
  appPath = packageFile.autoload[appNameSpace]
}

Helpers.basePath = function(){
  return rootPath
}

Helpers.appPath = function(){
  return appPath
}

Helpers.publicPath = function(){
  return path.join(rootPath,'./public')
}

Helpers.appNameSpace = function(){
  return appNameSpace
}

Helpers.configPath = function(){
  return path.join(rootPath,'./config')
}

Helpers.storagePath = function(){
  return path.join(rootPath,'./storage')
}

Helpers.publicPath = function(){
  return path.join(rootPath,'./public')
}

Helpers.resourcesPath = function(){
  return path.join(rootPath,'./resources')
}
