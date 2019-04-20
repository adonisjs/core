/*
 * @adonisjs/cookie
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export type CookieOptions = {
  domain: string,
  expires: Date,
  httpOnly: boolean,
  maxAge: number,
  path: string,
  sameSite: boolean | string,
  secure: boolean,
}
