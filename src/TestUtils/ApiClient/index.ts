/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Returns the config for configure the "@japa/api-client" plugin
 */
export function apiClientConfig(application: ApplicationContract) {
  const host = application.env.get('HOST', '0.0.0.0')
  const port = Number(application.env.get('PORT', '3333'))
  const cookieClient = application.container.resolveBinding('Adonis/Core/CookieClient')

  return {
    baseUrl: `http://${host}:${port}`,

    /**
     * Serializer to work with AdonisJS cookies
     */
    serializers: {
      cookie: {
        /**
         * The methods on the Request class encrypts and signs cookies.
         * Therefore, the prepare method returns the value as it is
         */
        prepare(_: string, value: any) {
          return value
        },

        /**
         * Process the server response and convert cookie value to a
         * plain string
         */
        process(key: string, value: any) {
          return cookieClient.parse(key, value)
        },
      },
    },
  }
}
