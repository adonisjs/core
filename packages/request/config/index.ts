/*
* @adonisjs/request
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as proxyaddr from 'proxy-addr'
import { RequestConfig } from '../src/RequestContract'

export const config: RequestConfig = {
  /*
  |--------------------------------------------------------------------------
  | Allow method spoofing
  |--------------------------------------------------------------------------
  |
  | Method spoofing is a way to make form submissions from HTML forms with
  | different HTTP verbs.
  |
  | For example: HTML forms does allow `method=PUT`, but you can make it work
  | setting `method=POST` and setting query string `_method=PUT`.
  |
  | By default allow method spoofing is turned off.
  |
  */
  allowMethodSpoofing: false,

  /*
  |--------------------------------------------------------------------------
  | Trust proxy
  |--------------------------------------------------------------------------
  |
  | Node.js servers run behind a proxy server like nginx. In that case, you
  | have to tell AdonisJs to trust the local proxy `loopback` in order
  | to read values from X-Forwaded headers.
  |
  | AdonisJs uses it to determine
  |
  | 1. Ip Address
  | 2. Hostnames
  | 3. SSL or not SSL
  |
  | Learn more about the values here https://www.npmjs.com/package/proxy-addr
  |
  */
  trustProxy: proxyaddr.compile('loopback'),

  /*
  |--------------------------------------------------------------------------
  | Get user ip
  |--------------------------------------------------------------------------
  |
  | Many proxy servers like nginx, passes the user ip address via different
  | HTTP header like `x-real-ip`. In that case, you can define the following
  | method to return the value from the that header.
  |
  | We recommend not to implement the following method and AdonisJs will use
  | `X-Forwarded-For` header to read the user ip.
  |
  */
  getIp: undefined,

  /*
  |--------------------------------------------------------------------------
  | Subdomain offset
  |--------------------------------------------------------------------------
  |
  | From which position (in reverse), AdonisJs should mark values as part of
  | subdomains. `subdomainOffset=2` is the most standard one.
  |
  | `blog.adonisjs.com` = ['blog']
  |
  | However, in following case, the `subdomainOffset=3` is required.
  |
  | `upfy.uol.com.br` = ['upfy']
  */
  subdomainOffset: 2,
}
