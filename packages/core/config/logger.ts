/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LoggerOptions } from '../src/Contracts/Logger'

export const loggerConfig: LoggerOptions = {
  /*
  |--------------------------------------------------------------------------
  | Name
  |--------------------------------------------------------------------------
  |
  | The name will be prepended to all log lines. You can remove this value or
  | set it to `undefined` to disable it.
  |
  */
  name: 'adonis',

  /*
  |--------------------------------------------------------------------------
  | Level
  |--------------------------------------------------------------------------
  |
  | The current logger level. All logs for the current and the above the
  | current level will be logged.
  |
  */
  level: 'info',

  /*
  |--------------------------------------------------------------------------
  | Log Destination
  |--------------------------------------------------------------------------
  |
  | Log destination defines where to write logs. One of the following values
  | are allowed.
  |
  | 1. `undefined`: Will use process.stdout
  | 2. `string`: Will be considered as the file path and passed to `pino.destination`.
  | 3. `pino.destination()`: The output of `pino.destination` method.
  |
  */
  logDestination: (pino) => {
    return pino.destination()
  },

  /*
  |--------------------------------------------------------------------------
  | Enabled
  |--------------------------------------------------------------------------
  |
  | Trigger to enable or disable the logger. You won't have to make any
  | changes to the code, just the logger internally will stop processing
  | logs.
  |
  */
  enabled: true,

  /*
  |--------------------------------------------------------------------------
  | Message Key
  |--------------------------------------------------------------------------
  |
  | The `key` that will hold the log message inside the JSON object. You may
  | have to change it based upon the service you are using to collect and
  | display logs.
  |
  */
  messageKey: 'msg',

  /*
  |--------------------------------------------------------------------------
  | Use level labels
  |--------------------------------------------------------------------------
  |
  | Use `level` labels over level numeric values. It is recommended to keep
  | is `false` for smaller log packets
  |
  */
  useLevelLabels: false,

  /*
  |--------------------------------------------------------------------------
  | Label key
  |--------------------------------------------------------------------------
  |
  | The key name to be used for outputting the level name or number inside the
  | JSON packet. Pino call it `changeLevelName` which feels a bit weird, so
  | decided to use `levelLabelKey` instead.
  |
  */
  levelLabelKey: 'level',

  /*
  |--------------------------------------------------------------------------
  | CRLF
  |--------------------------------------------------------------------------
  |
  | Setting this property to `true` will use `\r\n` as the new line delimeter.
  | Otherwise it's `\n`.
  |
  */
  crlf: false,

  /*
  |--------------------------------------------------------------------------
  | Timestamp
  |--------------------------------------------------------------------------
  |
  | Whether or not to use timestamps
  |
  */
  timestamp: true,
}
