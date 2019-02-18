import * as uuid from 'uuid/v1'
import { BodyParserConfig } from '../src/Contracts'

/**
 * Default config to be used. It will be deep merged
 * with the user config
 */
export const config: BodyParserConfig = {
  whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
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
  form: {
    encoding: 'utf-8',
    limit: '1mb',
    queryString: {},
    types: [
      'application/x-www-form-urlencoded',
    ],
  },
  raw: {
    encoding: 'utf-8',
    limit: '1mb',
    queryString: {},
    types: [
      'text/*',
    ],
  },
  multipart: {
    autoProcess: true,
    processManually: [],
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
