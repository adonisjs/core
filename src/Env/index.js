"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-http-dispatcher
 * @description - Loads .env file into process.env for managing environment
 */


// importing libs
const dotenv = require("dotenv"),
  Logger = require("../Logger");


// exporting env
let Env = exports = module.exports = {};


/**
 * loading .env file to process.env
 * @param  {String} path_to_env_file
 */
Env.load = function(path_to_env_file) {
  Logger.verbose(`loading environment config from ${path_to_env_file}`);
  dotenv.config({
    path: path_to_env_file
  });
}


/**
 * get value of a defined key on process.emv
 * @param  {String} key
 * @return {Any}
 */
Env.get = function(key){
  return process.env[key];
}


/**
 * sets key/value pair on proccess.env
 * @param {String} key
 * @param {Any} value
 */
Env.set = function(key,value){
  return process.env[key] = value;
}