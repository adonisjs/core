/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Shape of `levels` return value
 */
export type LoggerLevels = {
  labels: { [level: string]: string },
  values: { [labelValue: string]: number },
}

/**
 * Following are the config options accepted by the logger class
 */
export type LoggerOptions = {
  name?: string,
  level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent',
  enabled: boolean,
  messageKey: string,
  useLevelLabels: boolean,
  levelLabelKey: string,
  logDestination: ((pino: any) => any),
  crlf: boolean,
  redact?: {
    paths: string[],
    censor?: string,
    remove?: boolean,
  },
  base?: any,
  timestamp?: boolean | (() => string | number),
  prettyPrint?: boolean | Partial<{
    colorize: boolean,
    errorLikeObjectKeys: string[],
    errorProps: string,
    levelFirst: boolean,
    messageKey: string,
    translateTime: boolean,
  }>,
}

export interface LoggerContract {
  level: string,
  levels: LoggerLevels,
  trace (message: string, ...values: any[]): void,
  trace (mergingObject: any, message: string, ...values: any[]): void,

  debug (message: string, ...values: any[]): void,
  debug (mergingObject: any, message: string, ...values: any[]): void,

  info (message: string, ...values: any[]): void,
  info (mergingObject: any, message: string, ...values: any[]): void,

  warn (message: string, ...values: any[]): void,
  warn (mergingObject: any, message: string, ...values: any[]): void,

  error (message: string, ...values: any[]): void,
  error (mergingObject: any, message: string, ...values: any[]): void,

  fatal (message: string, ...values: any[]): void,
  fatal (mergingObject: any, message: string, ...values: any[]): void,

  isLevelEnabled (level: string): boolean,
}
