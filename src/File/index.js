"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-http-dispatcher
 * @description - File class to add helpers methods on top of uploaded file
 */

function File(files){
  this.files = files;
}



/**
 * move file to a given destination inside
 * registered public directory
 * @param {String} toPath
 */
File.prototype.move = function(toPath) {
};


/**
 * returns mime type for uploaded file
 * @return {String}
 */
File.prototype.mimeType = function() {
};


/**
 * returns file extension
 * @return {String}
 */
File.prototype.extension = function() {
};


/**
 * returns client name for uploaded file
 * @return {String}
 */
File.prototype.clientName = function(){
}



/**
 * returns client extension for uploaded file
 * @return {String}
 */
File.prototype.clientExtension = function() {
};



/**
 * returns client size for uploaded file
 * @return {String}
 */
File.prototype.clientSize = function() {
};


/**
 * returns upload errors if any
 * @return {Object}
 */
File.prototype.errors = function() {
};



module.exports = File;