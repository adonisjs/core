/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Shape of data packet for a single action
 */
export type ProfilerActionDataPacket = {
  row_id: string,
  type: 'action',
  action: string,
  timestamp: number,
  duration: [number, number],
  data: any,
}

/**
 * Shape of data packet for a single row
 */
export type ProfilerRowDataPacket = {
  id: string,
  type: 'row',
  label: string,
  timestamp: number,
  duration: [number, number],
  data: any,
  parent_id?: string,
}

/**
 * The subscriber action that listens for logs
 */
export type ProfilerSubscriber = (log: ProfilerActionDataPacket | ProfilerRowDataPacket) => void

/**
 * Profiler action just has one method to mark
 * the action as `done`.
 */
export interface ProfilerActionContract {
  end (data?: any): void
}

/**
 * Profiler row can spawn new actions or new rows
 */
export interface ProfilerRowContract {
  hasParent: boolean,
  child (label: string, data?: any): ProfilerRowContract,
  profile (action: string, data?: any): ProfilerActionContract,
  end (data?: any): void,
}

/**
 * Main profiler
 */
export interface ProfilerContract {
  subscriber?: ProfilerSubscriber,
  dummyAction: ProfilerActionContract,
  dummyRow: ProfilerRowContract,
  isEnabled (labelOrAction: string): boolean,
  create (label: string, data?: any): ProfilerRowContract,
  subscribe (fn: ProfilerSubscriber): void
}

/**
 * Profiler config
 */
export type ProfilerConfig = {
  enabled: boolean,
  whitelist: string[],
  blacklist: string[],
}
