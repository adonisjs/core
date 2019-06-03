/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as proxyAddr from 'proxy-addr'
import { RequestConfigContract } from '@ioc:Adonis/Core/Request'
import { ResponseConfigContract } from '@ioc:Adonis/Core/Response'
import { RequestLoggerConfigContract } from '@ioc:Adonis/Core/RequestLogger'
import { LoggerConfigContract } from '@ioc:Adonis/Core/Logger'
import Env from '@ioc:Adonis/Core/Env'

/*
|--------------------------------------------------------------------------
| Application secret key
|--------------------------------------------------------------------------
|
| The secret to encrypt, sign or hash different values in your application.
| Make sure to keep the `APP_KEY` as an environment variable and secure.
|
| Note: Changing the application key for an existing app will cause
| data loss.
|
*/
export const appKey: string = Env.getOrFail('APP_KEY') as string

/*
|--------------------------------------------------------------------------
| Http server configuration
|--------------------------------------------------------------------------
|
| The configuration for the HTTP(s) server. Make sure to go through all
| the config properties to make keep server secure.
|
*/
export const http: RequestConfigContract & ResponseConfigContract & RequestLoggerConfigContract = {
  /*
  |--------------------------------------------------------------------------
  | Log HTTP requests
  |--------------------------------------------------------------------------
  |
  | Set the value to true, to automatically log every HTTP requests. It is
  | okay to log requests in production too.
  |
  */
  logRequests: true,

  /*
  |--------------------------------------------------------------------------
  | Request log data
  |--------------------------------------------------------------------------
  |
  | Optional, custom function to log custom data with every HTTP request
  | log
  |
  */
  // requestLogData: () => {
  //   return {
  //     foo: 'bar',
  //   }
  // }

  /*
  |--------------------------------------------------------------------------
  | Allow method spoofing
  |--------------------------------------------------------------------------
  */
  allowMethodSpoofing: false,

  /*
  |--------------------------------------------------------------------------
  | Subdomain offset
  |--------------------------------------------------------------------------
  */
  subdomainOffset: 2,

  /*
  |--------------------------------------------------------------------------
  | Trusting proxy servers
  |--------------------------------------------------------------------------
  */
  trustProxy: proxyAddr.compile('loopback'),

  /*
  |--------------------------------------------------------------------------
  | Generating Etag
  |--------------------------------------------------------------------------
  */
  etag: false,

  /*
  |--------------------------------------------------------------------------
  | JSONP Callback
  |--------------------------------------------------------------------------
  */
  jsonpCallbackName: 'callback',

  /*
  |--------------------------------------------------------------------------
  | Cookie settings
  |--------------------------------------------------------------------------
  */
  cookie: {
    domain: '',
    path: '/',
    maxAge: 600,
    expires: new Date(),
    httpOnly: true,
    secure: false,
    sameSite: false,
  },
}

/*
|--------------------------------------------------------------------------
| Logger
|--------------------------------------------------------------------------
*/
export const logger: LoggerConfigContract = {
  /*
  |--------------------------------------------------------------------------
  | Application name
  |--------------------------------------------------------------------------
  |
  | The name of the application you want to add to the log. It is recommended
  | to always have app name in every log line.
  |
  | The `APP_NAME` environment variable is set by reading `appName` from
  | `.adonisrc.json` file.
  |
  */
  name: Env.get('APP_NAME') as string,

  /*
  |--------------------------------------------------------------------------
  | Toggle logger
  |--------------------------------------------------------------------------
  |
  | Enable or disable logger application wide
  |
  */
  enabled: true,

  /*
  |--------------------------------------------------------------------------
  | Logging level
  |--------------------------------------------------------------------------
  |
  | The level from which you want the logger to flush logs.
  |
  */
  level: 'info',

  /*
  |--------------------------------------------------------------------------
  | Pretty print
  |--------------------------------------------------------------------------
  |
  | It is highly advised not to use `prettyPrint` in production, since it
  | can have huge impact on performance
  |
  */
  prettyPrint: Env.get('NODE_ENV') === 'development',
}
