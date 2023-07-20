/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import vine, { BaseLiteralType, Vine } from '@vinejs/vine'
import type { FieldContext, FieldOptions, Validation } from '@vinejs/vine/types'
import type { MultipartFile, FileValidationOptions } from '@adonisjs/bodyparser/types'

/**
 * Checks if the value is an instance of multipart file
 * from bodyparser.
 */
function isBodyParserFile(file: unknown): file is MultipartFile {
  return !!(file && typeof file === 'object' && 'isMultipartFile' in file)
}

type ValidationOptions =
  | Partial<FileValidationOptions>
  | ((field: FieldContext) => Partial<FileValidationOptions>)

/**
 * VineJS validation rule that validates the file to be an
 * instance of BodyParser MultipartFile class.
 */
const isMultipartFile = vine.createRule<ValidationOptions>((file, options, field) => {
  /**
   * Report error when value is not a field multipart
   * file object
   */
  if (!isBodyParserFile(file)) {
    field.report('The {{ field }} must be a file', 'file', field)
    return
  }

  const validationOptions = typeof options === 'function' ? options(field) : options

  /**
   * Set size when it's defined in the options and missing
   * on the file instance
   */
  if (file.sizeLimit === undefined && validationOptions.size) {
    file.sizeLimit = validationOptions.size
  }

  /**
   * Set extensions when it's defined in the options and missing
   * on the file instance
   */
  if (file.allowedExtensions === undefined && validationOptions.extnames) {
    file.allowedExtensions = validationOptions.extnames
  }

  /**
   * Validate file
   */
  file.validate()

  /**
   * Report errors
   */
  file.errors.forEach((error) => {
    field.report(error.message, `file.${error.type}`, field, validationOptions)
  })
})

/**
 * Represents a multipart file uploaded via multipart/form-data HTTP
 * request.
 */
class VineMultipartFile extends BaseLiteralType<MultipartFile, MultipartFile> {
  #validationOptions?: ValidationOptions

  constructor(
    validationOptions?: ValidationOptions,
    options?: FieldOptions,
    validations?: Validation<any>[]
  ) {
    super(options, validations || [isMultipartFile(validationOptions || {})])
    this.#validationOptions = validationOptions
  }

  clone() {
    return new VineMultipartFile(
      this.#validationOptions,
      this.cloneOptions(),
      this.cloneValidations()
    ) as this
  }
}

/**
 * The file method is used to validate a field to be a valid
 * multipart file.
 */
Vine.macro('file', function (this: Vine, options) {
  return new VineMultipartFile(options)
})

/**
 * Notifying TypeScript
 */
declare module '@vinejs/vine' {
  interface Vine {
    file(options?: ValidationOptions): VineMultipartFile
  }
}
