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
 * Checks if the value is an instance of multipart file
 * from bodyparser.
 */
function isBodyParserFile(file: unknown): file is MultipartFile {
  return !!(file && typeof file === 'object' && 'isMultipartFile' in file)
}

/**
 * VineJS validation rule that validates the file to be an
 * instance of BodyParser MultipartFile class.
 */
const isMultipartFile = vine.createRule<FileRuleValidationOptions>((file, options, field) => {
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
export class VineMultipartFile extends BaseLiteralType<
  MultipartFile,
  MultipartFile,
  MultipartFile
> {
  #validationOptions?: FileRuleValidationOptions;

  [MULTIPART_FILE] = 'multipartFile'

  constructor(
    validationOptions?: FileRuleValidationOptions,
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
