/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { setTimeout } from 'node:timers/promises'

/**
 * Ensures a callback takes at least a minimum amount of time to execute.
 * This helps prevent timing attacks where an attacker measures response times
 * to infer sensitive information (e.g., user enumeration via password reset).
 *
 * @example
 * ```ts
 * // Password reset: both paths (user exists or not) take same minimum time
 * return safeTiming(200, async () => {
 *   const user = await User.findBy('email', email)
 *   if (user) await sendResetEmail(user)
 *   return { message: 'If this email exists, you will receive a reset link.' }
 * })
 *
 * // API token verification: skip the delay on valid token
 * return safeTiming(200, async (timing) => {
 *   const token = await Token.findBy('value', request.header('x-api-key'))
 *   if (token) {
 *     timing.returnEarly()
 *     return token.owner
 *   }
 *   throw new UnauthorizedException()
 * })
 * ```
 */
export async function safeTiming<T>(
  minimumMs: number,
  callback: (timing: { returnEarly(): void }) => Promise<T>
): Promise<T> {
  let shouldReturnEarly = false
  const timing = {
    returnEarly() {
      shouldReturnEarly = true
    },
  }

  const startTime = performance.now()
  let result: T
  let caughtError: unknown

  try {
    result = await callback(timing)
  } catch (error) {
    caughtError = error
  }

  if (!shouldReturnEarly) {
    const remaining = minimumMs - (performance.now() - startTime)
    if (remaining > 0) await setTimeout(remaining)
  }

  if (caughtError) throw caughtError

  return result!
}
