import * as uuid from 'uuid/v1'
import { BodyParserConfig } from '../src/Contracts'

/**
 * Default config to be used. It will be deep merged
 * with the user config
 */
export const config: BodyParserConfig = {
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
  | supoorted by bodyparser.
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
    | You can turn off `autoProcess` for certain routes as well by defining
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
    | file name.
    |
    */
    tmpFileName () {
      return `ab-${uuid()}.tmp`
    },
    encoding: 'utf-8',
    limit: '20mb',
    types: [
      'multipart/form-data',
    ],
  },
}
