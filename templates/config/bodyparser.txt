/**
 * Config source: https://git.io/Jfefn
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import { BodyParserConfig } from '@ioc:Adonis/Core/BodyParser'

const bodyParserConfig: BodyParserConfig = {
  /*
  |--------------------------------------------------------------------------
  | White listed methods
  |--------------------------------------------------------------------------
  |
  | HTTP methods for which body parsing must be performed. It is a good practice
  | to avoid body parsing for `GET` requests.
  |
  */
  whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  /*
  |--------------------------------------------------------------------------
  | JSON parser settings
  |--------------------------------------------------------------------------
  |
  | The settings for the JSON parser. The types defines the request content
  | types which gets processed by the JSON parser.
  |
  */
  json: {
    encoding: 'utf-8',
    limit: '1mb',
    strict: true,
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Form parser settings
  |--------------------------------------------------------------------------
  |
  | The settings for the `application/x-www-form-urlencoded` parser. The types
  | defines the request content types which gets processed by the form parser.
  |
  */
  form: {
    encoding: 'utf-8',
    limit: '1mb',
    queryString: {},
    types: [
      'application/x-www-form-urlencoded',
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Raw body parser settings
  |--------------------------------------------------------------------------
  |
  | Raw body just reads the request body stream as a plain text, which you
  | can process by hand. This must be used when request body type is not
  | supported by the body parser.
  |
  */
  raw: {
    encoding: 'utf-8',
    limit: '1mb',
    queryString: {},
    types: [
      'text/*',
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Multipart parser settings
  |--------------------------------------------------------------------------
  |
  | The settings for the `multipart/form-data` parser. The types defines the
  | request content types which gets processed by the form parser.
  |
  */
  multipart: {
    /*
    |--------------------------------------------------------------------------
    | Auto process
    |--------------------------------------------------------------------------
    |
    | The auto process option will process uploaded files and writes them to
    | the `tmp` folder. You can turn it off and then manually use the stream
    | to pipe stream to a different destination.
    |
    | It is recommended to keep `autoProcess=true`. Unless you are processing bigger
    | file sizes.
    |
    */
    autoProcess: true,

    /*
    |--------------------------------------------------------------------------
    | Files to be processed manually
    |--------------------------------------------------------------------------
    |
    | You can turn off `autoProcess` for certain routes by defining
    | routes inside the following array.
    |
    | NOTE: Make sure the route pattern starts with a leading slash.
    |
    | Correct
    | ```js
    | /projects/:id/file
    | ```
    |
    | Incorrect
    | ```js
    | projects/:id/file
    | ```
    */
    processManually: [],

    /*
    |--------------------------------------------------------------------------
    | Temporary file name
    |--------------------------------------------------------------------------
    |
    | When auto processing is on. We will use this method to compute the temporary
    | file name. AdonisJs will compute a unique `tmpPath` for you automatically,
    | However, you can also define your own custom method.
    |
    */
    // tmpFileName () {
    // },

    /*
    |--------------------------------------------------------------------------
    | Encoding
    |--------------------------------------------------------------------------
    |
    | Request body encoding
    |
    */
    encoding: 'utf-8',

    /*
    |--------------------------------------------------------------------------
    | Max Fields
    |--------------------------------------------------------------------------
    |
    | The maximum number of fields allowed in the request body. The field includes
    | text inputs and files both.
    |
    */
    maxFields: 1000,

    /*
    |--------------------------------------------------------------------------
    | Request body limit
    |--------------------------------------------------------------------------
    |
    | The total limit to the multipart body. This includes all request files
    | and fields data.
    |
    */
    limit: '20mb',

    /*
    |--------------------------------------------------------------------------
    | Types
    |--------------------------------------------------------------------------
    |
    | The types that will be considered and parsed as multipart body.
    |
    */
    types: [
      'multipart/form-data',
    ],
  },
}

export default bodyParserConfig
