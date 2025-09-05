/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { InvalidArgumentsException } from '@poppinss/utils/exception'

import debug from '../../src/debug.ts'
import type { Argon } from './drivers/argon.ts'
import type { Scrypt } from './drivers/scrypt.ts'
import type { Bcrypt } from './drivers/bcrypt.ts'
import type { ConfigProvider } from '../../src/types.ts'
import { configProvider } from '../../src/config_provider.ts'
import type {
  ArgonConfig,
  BcryptConfig,
  ScryptConfig,
  ManagerDriverFactory,
} from '../../types/hash.ts'

/**
 * Resolved config from the config provider will be
 * the config accepted by the hash manager
 */
type ResolvedConfig<
  KnownHashers extends Record<string, ManagerDriverFactory | ConfigProvider<ManagerDriverFactory>>,
> = {
  default?: keyof KnownHashers
  list: {
    [K in keyof KnownHashers]: KnownHashers[K] extends ConfigProvider<infer A> ? A : KnownHashers[K]
  }
}

/**
 * Define config for the hash service. This function creates a configuration
 * provider that lazily imports and resolves hash drivers when needed.
 *
 * @param config - Configuration object containing default hasher and list of hashers
 * @param config.default - Optional default hasher name (must exist in the list)
 * @param config.list - Record of hasher configurations or config providers
 *
 * @example
 * ```ts
 * const hashConfig = defineConfig({
 *   default: 'scrypt',
 *   list: {
 *     scrypt: drivers.scrypt({
 *       cost: 16384,
 *       blockSize: 8,
 *       parallelization: 1,
 *       saltSize: 16,
 *       keyLength: 64,
 *     }),
 *     bcrypt: drivers.bcrypt({
 *       rounds: 10,
 *     })
 *   }
 * })
 * ```
 */
export function defineConfig<
  KnownHashers extends Record<string, ManagerDriverFactory | ConfigProvider<ManagerDriverFactory>>,
>(config: {
  default?: keyof KnownHashers
  list: KnownHashers
}): ConfigProvider<ResolvedConfig<KnownHashers>> {
  /**
   * Hashers list should always be provided
   */
  if (!config.list) {
    throw new InvalidArgumentsException('Missing "list" property in hash config')
  }

  /**
   * The default hasher should be mentioned in the list
   */
  if (config.default && !config.list[config.default]) {
    throw new InvalidArgumentsException(
      `Missing "list.${String(
        config.default
      )}" in hash config. It is referenced by the "default" property`
    )
  }

  /**
   * Config provider to lazily import drivers as they are used inside
   * the user application
   */
  return configProvider.create<ResolvedConfig<KnownHashers>>(async (app) => {
    debug('resolving hash config')

    const hashersList = Object.keys(config.list)
    const hashers = {} as Record<
      string,
      ManagerDriverFactory | ConfigProvider<ManagerDriverFactory>
    >

    for (let hasherName of hashersList) {
      const hasher = config.list[hasherName]
      if (typeof hasher === 'function') {
        hashers[hasherName] = hasher
      } else {
        hashers[hasherName] = await hasher.resolver(app)
      }
    }

    return {
      default: config.default,
      list: hashers as ResolvedConfig<KnownHashers>['list'],
    }
  })
}

/**
 * Helpers to configure drivers inside the config file. These functions create
 * configuration providers that lazily import and instantiate hash drivers.
 *
 * - Import happens when you first use the hash module
 * - Construction of drivers happens when you first use a driver
 *
 * @example
 * ```ts
 * const hashConfig = defineConfig({
 *   default: 'bcrypt',
 *   list: {
 *     bcrypt: drivers.bcrypt({ rounds: 12 }),
 *     argon2: drivers.argon2({ 
 *       variant: 'id',
 *       memory: 65536,
 *       time: 3,
 *       parallelism: 4
 *     }),
 *     scrypt: drivers.scrypt({
 *       cost: 16384,
 *       blockSize: 8,
 *       parallelization: 1
 *     })
 *   }
 * })
 * ```
 */
export const drivers: {
  argon2: (config: ArgonConfig) => ConfigProvider<() => Argon>
  bcrypt: (config: BcryptConfig) => ConfigProvider<() => Bcrypt>
  scrypt: (config: ScryptConfig) => ConfigProvider<() => Scrypt>
} = {
  argon2: (config) => {
    return configProvider.create(async () => {
      const { Argon } = await import('./drivers/argon.js')
      debug('configuring argon driver')
      return () => new Argon(config)
    })
  },
  bcrypt: (config) => {
    return configProvider.create(async () => {
      const { Bcrypt } = await import('./drivers/bcrypt.js')
      debug('configuring bcrypt driver')
      return () => new Bcrypt(config)
    })
  },
  scrypt: (config) => {
    return configProvider.create(async () => {
      const { Scrypt } = await import('./drivers/scrypt.js')
      debug('configuring scrypt driver')
      return () => new Scrypt(config)
    })
  },
}
