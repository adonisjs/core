/**
 * Config source: https://git.io/JfefC
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import { CorsConfig } from '@ioc:Adonis/Core/Cors'

const corsConfig: CorsConfig = {
  /*
  |--------------------------------------------------------------------------
  | Enabled
  |--------------------------------------------------------------------------
  |
  | A boolean to enable or disable CORS integration from your AdonisJs
  | application.
  |
  | Setting the value to `true` will enable the CORS for all HTTP request. However,
  | you can define a function to enable/disable it on per request basis as well.
  |
  */
  enabled: false,

  // You can also use a function that return true or false.
  // enabled: (request) => request.url().startsWith('/api')

  /*
  |--------------------------------------------------------------------------
  | Origin
  |--------------------------------------------------------------------------
  |
  | Set a list of origins to be allowed for `Access-Control-Allow-Origin`.
  | The value can be one of the following:
  |
  | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
  |
  | Boolean (true)    - Allow current request origin.
  | Boolean (false)   - Disallow all.
  | String            - Comma separated list of allowed origins.
  | Array             - An array of allowed origins.
  | String (*)        - A wildcard (*) to allow all request origins.
  | Function          - Receives the current origin string and should return
  |                     one of the above values.
  |
  */
  origin: true,

  /*
  |--------------------------------------------------------------------------
  | Methods
  |--------------------------------------------------------------------------
  |
  | An array of allowed HTTP methods for CORS. The `Access-Control-Request-Method`
  | is checked against the following list.
  |
  | Following is the list of default methods. Feel free to add more.
  */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],

  /*
  |--------------------------------------------------------------------------
  | Headers
  |--------------------------------------------------------------------------
  |
  | List of headers to be allowed for `Access-Control-Allow-Headers` header.
  | The value can be one of the following:
  |
  | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers
  |
  | Boolean(true)     - Allow all headers mentioned in `Access-Control-Request-Headers`.
  | Boolean(false)    - Disallow all headers.
  | String            - Comma separated list of allowed headers.
  | Array             - An array of allowed headers.
  | Function          - Receives the current header and should return one of the above values.
  |
  */
  headers: true,

  /*
  |--------------------------------------------------------------------------
  | Expose Headers
  |--------------------------------------------------------------------------
  |
  | A list of headers to be exposed by setting `Access-Control-Expose-Headers`.
  | header. By default following 6 simple response headers are exposed.
  |
  | Cache-Control
  | Content-Language
  | Content-Type
  | Expires
  | Last-Modified
  | Pragma
  |
  | In order to add more headers, simply define them inside the following array.
  |
  | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
  |
  */
  exposeHeaders: [
    'cache-control',
    'content-language',
    'content-type',
    'expires',
    'last-modified',
    'pragma',
  ],

  /*
  |--------------------------------------------------------------------------
  | Credentials
  |--------------------------------------------------------------------------
  |
  | Toggle `Access-Control-Allow-Credentials` header. If value is set to `true`,
  | then header will be set, otherwise not.
  |
  | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
  |
  */
  credentials: true,

  /*
  |--------------------------------------------------------------------------
  | MaxAge
  |--------------------------------------------------------------------------
  |
  | Define `Access-Control-Max-Age` header in seconds.
  | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
  |
  */
  maxAge: 90,
}

export default corsConfig
