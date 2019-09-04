/**
 * Config source: https://git.io/fj1K7
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import proxyAddr from 'proxy-addr'
import Env from '@ioc:Adonis/Core/Env'
import { LoggerConfigContract } from '@ioc:Adonis/Core/Logger'
import { RequestConfigContract } from '@ioc:Adonis/Core/Request'
import { ResponseConfigContract } from '@ioc:Adonis/Core/Response'
import { ProfilerConfigContract } from '@ioc:Adonis/Core/Profiler'

type HttpOptions = RequestConfigContract & ResponseConfigContract

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
export const http: HttpOptions = {
  /*
  |--------------------------------------------------------------------------
  | Allow method spoofing
  |--------------------------------------------------------------------------
  |
  | Method spoofing enables defining custom HTTP methods using a query string
  | `_method`. This is usually required when you are making traditional
  | form requests and wants to use HTTP verbs like `PUT`, `DELETE` and
  | so on.
  |
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
  | Request Ids
  |--------------------------------------------------------------------------
  |
  | Setting this value to `true` will generate a unique request id for each
  | HTTP request and set it as `x-request-id` header.
  |
  */
  generateRequestId: false,

  /*
  |--------------------------------------------------------------------------
  | Trusting proxy servers
  |--------------------------------------------------------------------------
  |
  | Define the proxy servers that AdonisJs must trust for reading `X-Forwarded`
  | headers.
  |
  */
  trustProxy: proxyAddr.compile('loopback'),

  /*
  |--------------------------------------------------------------------------
  | Generating Etag
  |--------------------------------------------------------------------------
  |
  | Whether or not to generate an etag for every response.
  |
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
  | The level from which you want the logger to flush logs. It is recommended
  | to make use of the environment variable, so that you can define log levels
  | at deployment level and not code level.
  |
  */
  level: Env.get('LOG_LEVEL', 'info') as string,

  /*
  |--------------------------------------------------------------------------
  | Pretty print
  |--------------------------------------------------------------------------
  |
  | It is highly advised NOT to use `prettyPrint` in production, since it
  | can have huge impact on performance.
  |
  */
  prettyPrint: Env.get('NODE_ENV') === 'development',
}

/*
|--------------------------------------------------------------------------
| Profiler
|--------------------------------------------------------------------------
*/
export const profiler: ProfilerConfigContract = {
  /*
  |--------------------------------------------------------------------------
  | Toggle profiler
  |--------------------------------------------------------------------------
  |
  | Enable or disable profiler
  |
  */
  enabled: true,

  /*
  |--------------------------------------------------------------------------
  | Blacklist actions/row labels
  |--------------------------------------------------------------------------
  |
  | Define an array of actions or row labels that you want to disable from
  | getting profiled.
  |
  */
  blacklist: [],

  /*
  |--------------------------------------------------------------------------
  | Whitelist actions/row labels
  |--------------------------------------------------------------------------
  |
  | Define an array of actions or row labels that you want to whitelist for
  | the profiler. When whitelist is defined, then `blacklist` is ignored.
  |
  */
  whitelist: [],
}
