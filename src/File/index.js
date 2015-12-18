'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const path = require('path')
const fs = require ('fs')

/**
 * @class  File
 * @description File manager class to handle file uploads
 */
class File{

  constructor (File) {
    this.file = File
  }

  /**
   * @description moves uploaded file from tmpPath to given location
   * @method move
   * @param  {String} toPath
   * @param  {String} name
   * @return {void}
   * @public
   */
  move (toPath, name) {
    name = name || this.clientName()
    const uploadingFileName = `${toPath}/${name}`
    return new Promise ((resolve) => {

      fs.rename(this.tmpPath(), uploadingFileName, (err) => {
        if(err){
          this.file.error = err
          this.file.filename = null
          this.file.filepath = null
        }else{
          this.file.error = null
          this.file.filename = name
          this.file.filepath = uploadingFileName
        }
        resolve()
      })

    })
  }

  /**
   * @description returns file name on clients machine
   * @method clientName
   * @return {String}
   * @public
   */
  clientName () {
    return this.file.name
  }

  /**
   * @description returns file mime type detected from
   * clients machine
   * @method mimeType
   * @return {String}
   * @public
   */
  mimeType () {
    return this.file.type
  }

  /**
   * @description returns upload file extension
   * @method extension
   * @return {String}
   * @public
   */
  extension () {
    return path.extname(this.clientName()).replace('.', '')
  }

  /**
   * @description returns file size from client machine
   * @method clientSize
   * @return {String}
   * @public
   */
  clientSize () {
    return this.file.size
  }

  /**
   * @description return tmp path of file
   * after successfull upload
   * @method tmpPath
   * @return {String}
   * @public
   */
  tmpPath () {
    return this.file.path
  }

  /**
   * @description returns file name after moving file
   * @method uploadName
   * @return {String}
   * @public
   */
  uploadName() {
    return this.file.filename
  }

  /**
   * @description returns complete uploadPath
   * @method uploadPath
   * @return {String}
   * @public
   */
  uploadPath () {
    return this.file.filepath
  }

  /**
   * @description tells whether file exists on tmp path or not
   * @method exists
   * @return {Boolean}
   * @public
   */
  exists () {
    return !!this.tmpPath()
  }

  /**
   * @description tells whether move operation was sucessfull or
   * not
   * @method moved
   * @return {Boolean}
   * @public
   */
  moved() {
    return !this.errors()
  }

  /**
   * @description returns errors caused while moving file
   * @method errors
   * @return {Object}
   */
  errors () {
    return this.file.error || null
  }

}

module.exports = File
