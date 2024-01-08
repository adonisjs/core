/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { InvalidArgumentsException } from '@poppinss/utils'

import debug from '../../src/debug.js'
import type { Argon } from './drivers/argon.js'
import type { Scrypt } from './drivers/scrypt.js'
import type { Bcrypt } from './drivers/bcrypt.js'
import type { ConfigProvider } from '../../src/types.js'
import { configProvider } from '../../src/config_provider.js'
import type {
  ArgonConfig,
  BcryptConfig,
  ScryptConfig,
  ManagerDriverFactory,
} from '../../types/hash.js'

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
 * Define config for the hash service.
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
 * Helpers to configure drivers inside the config file. The
 * drivers will be imported and constructed lazily.
 *
 * - Import happens when you first use the hash module
 * - Construction of drivers happens when you first use a driver
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
