/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import debug from '../../src/debug.ts'
import { configProvider } from '../../src/config_provider.ts'
import { type ConfigProvider } from '../../src/types.ts'

import {
  type AES256CBCDriverConfig,
  type AES256GCMDriverConfig,
  type ChaCha20Poly1305DriverConfig,
} from '../../types/encryption.ts'
import { type EncryptionConfig } from '../../types/encryption.ts'
import { InvalidArgumentsException } from '../../src/exceptions.ts'

/**
 * Resolved configuration from the config provider that will be
 * accepted by the encryption manager.
 *
 * This type unwraps ConfigProvider types to their resolved values,
 * ensuring all encryptors in the list are concrete EncryptionConfig
 * objects rather than providers.
 *
 * @template KnownEncryptors - Record of encryptor names to their configurations
 */
type ResolvedConfig<
  KnownEncryptors extends Record<string, EncryptionConfig | ConfigProvider<EncryptionConfig>>,
> = {
  /**
   * The default encryptor name to use when no specific
   * encryptor is requested
   */
  default?: keyof KnownEncryptors

  /**
   * Map of encryptor names to their resolved configurations.
   * ConfigProvider types are unwrapped to their underlying
   * EncryptionConfig values.
   */
  list: {
    [K in keyof KnownEncryptors]: KnownEncryptors[K] extends ConfigProvider<infer A>
      ? A
      : KnownEncryptors[K]
  }
}

/**
 * Defines the encryption configuration for the application.
 *
 * This function creates a configuration provider that lazily resolves
 * encryption drivers. It validates that the default encryptor (if specified)
 * exists in the list and resolves any ConfigProvider instances to their
 * concrete values.
 *
 * @template KnownEncryptors - Record of encryptor names to their configurations
 *
 * @param config - The encryption configuration object
 * @param config.default - Optional default encryptor name
 * @param config.list - Map of encryptor names to their configurations or providers
 *
 * @example
 * ```ts
 * const encryptionConfig = defineConfig({
 *   default: 'app',
 *   list: {
 *     app: drivers.aes256gcm({
 *       id: 'app',
 *       keys: [env.get('APP_KEY')]
 *     }),
 *     backup: drivers.chacha20({
 *       id: 'backup',
 *       keys: [env.get('BACKUP_KEY')]
 *     })
 *   }
 * })
 * ```
 */
export function defineConfig<
  KnownEncryptors extends Record<string, EncryptionConfig | ConfigProvider<EncryptionConfig>>,
>(config: {
  default?: keyof KnownEncryptors
  list: KnownEncryptors
}): ConfigProvider<ResolvedConfig<KnownEncryptors>> {
  /**
   * Encryption list should always be provided
   */
  if (!config.list) {
    throw new InvalidArgumentsException('Missing "list" property in encryption config')
  }

  /**
   * The default encryption should be mentioned in the list
   */
  if (config.default && !config.list[config.default]) {
    throw new InvalidArgumentsException(
      `Missing "list.${String(
        config.default
      )}" in encryption config. It is referenced by the "default" property`
    )
  }

  /**
   * Config provider to lazily import drivers as they are used inside
   * the user application
   */
  return configProvider.create<ResolvedConfig<KnownEncryptors>>(async (app) => {
    debug('resolving encryption config')

    const encryptorsList = Object.keys(config.list)
    const encryptors = {} as Record<string, EncryptionConfig | ConfigProvider<EncryptionConfig>>

    for (let encryptorName of encryptorsList) {
      const encryptor = config.list[encryptorName]
      if ('resolver' in encryptor) {
        encryptors[encryptorName] = await encryptor.resolver(app)
      } else {
        encryptors[encryptorName] = encryptor
      }
    }

    return {
      default: config.default,
      list: encryptors as ResolvedConfig<KnownEncryptors>['list'],
    }
  })
}

/**
 * Collection of encryption driver factory functions.
 *
 * Each driver factory creates a ConfigProvider that lazily imports
 * and configures the corresponding encryption driver. This allows
 * for efficient code splitting and on-demand loading of encryption
 * algorithms.
 */
export const drivers: {
  /**
   * Creates a ChaCha20-Poly1305 encryption driver configuration.
   *
   * ChaCha20-Poly1305 is a modern authenticated encryption algorithm
   * that provides excellent performance on systems without AES hardware
   * acceleration.
   *
   * @param config - The ChaCha20-Poly1305 driver configuration
   *
   * @example
   * ```ts
   * drivers.chacha20({
   *   id: 'app',
   *   keys: [env.get('APP_KEY')]
   * })
   * ```
   */
  chacha20: (config: ChaCha20Poly1305DriverConfig) => ConfigProvider<EncryptionConfig>

  /**
   * Creates an AES-256-CBC encryption driver configuration.
   *
   * AES-256-CBC is a widely-supported block cipher mode. However,
   * consider using AES-256-GCM for new applications as it provides
   * authenticated encryption.
   *
   * @param config - The AES-256-CBC driver configuration
   *
   * @example
   * ```ts
   * drivers.aes256cbc({
   *   id: 'legacy',
   *   keys: [env.get('LEGACY_KEY')]
   * })
   * ```
   */
  aes256cbc: (config: AES256CBCDriverConfig) => ConfigProvider<EncryptionConfig>

  /**
   * Creates an AES-256-GCM encryption driver configuration.
   *
   * AES-256-GCM is an authenticated encryption algorithm that provides
   * both confidentiality and integrity. It offers excellent performance
   * on systems with AES hardware acceleration.
   *
   * @param config - The AES-256-GCM driver configuration
   *
   * @example
   * ```ts
   * drivers.aes256gcm({
   *   id: 'app',
   *   keys: [env.get('APP_KEY')]
   * })
   * ```
   */
  aes256gcm: (config: AES256GCMDriverConfig) => ConfigProvider<EncryptionConfig>
} = {
  chacha20: (config) => {
    return configProvider.create(async () => {
      const { ChaCha20Poly1305 } = await import('./drivers/chacha20_poly1305.ts')
      debug('configuring chacha20 encryption driver')
      return {
        driver: (key) => new ChaCha20Poly1305({ id: config.id, key }),
        keys: config.keys.filter((key) => !!key),
      }
    })
  },

  aes256cbc: (config) => {
    return configProvider.create(async () => {
      const { AES256CBC } = await import('./drivers/aes_256_cbc.ts')
      debug('configuring aes256cbc encryption driver')
      return {
        driver: (key) => new AES256CBC({ id: config.id, key }),
        keys: config.keys.filter((key) => !!key),
      }
    })
  },

  aes256gcm: (config) => {
    return configProvider.create(async () => {
      const { AES256GCM } = await import('./drivers/aes_256_gcm.ts')
      debug('configuring aes256gcm encryption driver')
      return {
        driver: (key) => new AES256GCM({ id: config.id, key }),
        keys: config.keys.filter((key) => !!key),
      }
    })
  },
}
