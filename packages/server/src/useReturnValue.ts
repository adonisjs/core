/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Returns a boolean telling if return value of route handler
 * or error handler should be used or not
 */
export function useReturnValue (returnValue, ctx) {
  return (
    returnValue !== undefined &&            // Return value is explicitly defined
    returnValue !== ctx.response &&         // Return value is not the instance of response object
    ctx.response.explicitEnd &&             // Explicit end is set to true
    !ctx.response.hasLazyBody               // Lazy body is not set
  )
}
