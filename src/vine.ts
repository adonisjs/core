/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import vine, { symbols, BaseLiteralType } from '@vinejs/vine'
import type { Validation, FieldContext, FieldOptions } from '@vinejs/vine/types'
import type { MultipartFile, FileValidationOptions } from '@adonisjs/bodyparser/types'

const MULTIPART_FILE: typeof symbols.SUBTYPE = symbols.SUBTYPE ?? Symbol.for('subtype')

/**
 * Validation options accepted by the "file" rule
 */
export type FileRuleValidationOptions =
  | Partial<FileValidationOptions>
  | ((field: FieldContext) => Partial<FileValidationOptions>)

/**
 * Checks if the value is an instance of multipart file from bodyparser.
 * Used internally for type guarding in file validation.
 *
 * @param file - The value to check for MultipartFile instance
 */
function isBodyParserFile(file: unknown): file is MultipartFile {
  return !!(file && typeof file === 'object' && 'isMultipartFile' in file)
}

/**
 * VineJS validation rule that validates the file to be an instance of BodyParser
 * MultipartFile class and applies size/extension validation if configured.
 *
 * @param file - The file value to validate
 * @param options - Validation options for file size and extensions
 * @param field - The field context from VineJS validation
 */
const isMultipartFile = vine.createRule<FileRuleValidationOptions>((file, options, field) => {
  if (!field.isDefined) {
    return false
  }

  /**
   * Report error when value is not a field multipart
   * file object
   */
  if (!isBodyParserFile(file)) {
    field.report('The {{ field }} must be a file', 'file', field)
    return false
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

  return file.isValid
})

/**
 * Represents a multipart file uploaded via multipart/form-data HTTP
 * request. This class extends VineJS's BaseLiteralType to provide
 * specialized validation for uploaded files.
 *
 * @example
 * const fileSchema = vine.object({
 *   avatar: vine.file({
 *     size: '2mb',
 *     extnames: ['jpg', 'png']
 *   })
 * })
 */
export class VineMultipartFile extends BaseLiteralType<
  MultipartFile,
  MultipartFile,
  MultipartFile
> {
  /**
   * Private validation options for file validation
   */
  #validationOptions?: FileRuleValidationOptions;

  /**
   * Symbol identifier for multipart file subtype
   */
  [MULTIPART_FILE] = 'multipartFile'

  /**
   * Creates a new VineMultipartFile instance
   *
   * @param validationOptions - File validation options like size limits and allowed extensions
   * @param options - Field options from VineJS
   * @param validations - Array of validation functions to apply
   */
  constructor(
    validationOptions?: FileRuleValidationOptions,
    options?: FieldOptions,
    validations?: Validation<any>[]
  ) {
    super(options, validations || [])
    this.#validationOptions = validationOptions
    this.dataTypeValidator = isMultipartFile(validationOptions || {})
  }

  /**
   * Creates a clone of the current VineMultipartFile instance
   * with the same validation options and configurations
   */
  clone() {
    return new VineMultipartFile(
      this.#validationOptions,
      this.cloneOptions(),
      this.cloneValidations()
    ) as this
  }
}
