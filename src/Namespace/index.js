'use strict'

const fold = require('fold')
const Registerar = fold.Registerar
const path = require('path')

/**
 * @module Namespace
 * @author Harminder Virk
 */
function Namespace(Env,Helpers){
  this.env = Env
  this.helpers = Helpers
}

/**
 * @function register
 * @description registers autoloading config to process.env
 * and autoloads given directory under a defined namespace
 * @param  {Object} packageFile
 * @return {void}
 */
Namespace.prototype.autoload = function(){

  const self = this

  return new Promise(function (resolve, reject) {

    const appDir = self.helpers.appPath()
    const foldNamespace = self.helpers.appNameSpace()

    if(self.env.get('autoload')){
      Registerar.autoload(appDir,appDir,foldNamespace).then(resolve).catch(reject)
    }else{
      resolve()
    }
  })
}

module.exports = Namespace
