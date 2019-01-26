/*
 * @adonisjs/utils
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Extended exception class that allows setting `status` and
 * `code` on the error object
 */
export class Exception extends Error {
  public name: string
  public message: string
  public code?: string
  public status: number

  constructor (message: string, status: number = 500, code?: string) {
    super(message)

    /**
     * Set error message
     */
    Object.defineProperty(this, 'message', {
      configurable: true,
      enumerable: false,
      value: code ? `${code}: ${message}` : message,
      writable: true,
    })

    /**
     * Set error name as a public property
     */
    Object.defineProperty(this, 'name', {
      configurable: true,
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    })

    /**
     * Set status as a public property
     */
    Object.defineProperty(this, 'status', {
      configurable: true,
      enumerable: false,
      value: status,
      writable: true,
    })

    /**
     * Set error code as a public property (only when defined)
     */
    if (code) {
      Object.defineProperty(this, 'code', {
        configurable: true,
        enumerable: false,
        value: code,
        writable: true,
      })
    }

    /**
     * Update the stack trace
     */
    Error.captureStackTrace(this, this.constructor)
  }
}
