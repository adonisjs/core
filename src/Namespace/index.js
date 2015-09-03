'use strict'

const fold = require('fold')
const Registerar = fold.Registerar
const path = require('path')

/**
 * @module Namespace
 * @author Harminder Virk
 */
function Namespace(Env){
  this.env = Env
}

/**
 * @function register
 * @description registers autoloading config to process.env
 * and autoloads given directory under a defined namespace
 * @param  {Object} packageFile
 * @return {void}
 */
Namespace.prototype.autoload = function(packagePath){

  let self =  this
  const packageFile = require(packagePath)

  return new Promise(function (resolve, reject) {

    if(!packageFile.autoload){
      return reject('autoloading is not configured inside package.json file, which must be configured')
    }

    const autoloadKeys = Object.keys(packageFile.autoload)
    if(autoloadKeys <= 0){
      return reject('autoloading is not configured inside package.json file, which must be configured')
    }

    const foldNamespace = autoloadKeys[0]
    const appDir = path.resolve(path.dirname(packagePath),packageFile.autoload[foldNamespace])
    process.env.foldNamespace = foldNamespace

    if(self.env.get('autoload')){
      Registerar.autoload(appDir,appDir,foldNamespace).then(resolve).catch(reject)
    }else{
      resolve()
    }
  })
}

module.exports = Namespace
