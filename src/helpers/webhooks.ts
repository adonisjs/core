/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createHmac, createPublicKey, verify as verifySignature, type KeyObject } from 'node:crypto'
import string from '@poppinss/utils/string'
import { safeEqual, Secret } from '@poppinss/utils'

/**
 * Raw payload supported by the webhook verifier.
 */
export type WebhookPayload = string | Buffer

/**
 * Header bag used by the webhook verifiers.
 */
export type WebhookHeaders = Record<string, string | string[] | undefined>

/**
 * A parsed webhook signature entry.
 */
export type WebhookSignature = {
  scheme: string
  signature: string
}

/**
 * Reasons for webhook verification failures.
 */
export type WebhookVerificationErrorCode =
  | 'missing_headers'
  | 'invalid_timestamp'
  | 'timestamp_out_of_range'
  | 'invalid_signature_header'
  | 'signature_mismatch'
  | 'unsupported_signature'

/**
 * Result returned by the webhook verifiers.
 */
export type WebhookVerificationResult = {
  isValid: boolean
  reason?: WebhookVerificationErrorCode
  webhookId?: string
  timestamp?: number
  matchedSignature?: WebhookSignature
}

/**
 * Successful verification result.
 */
export type WebhookVerificationSuccess = WebhookVerificationResult & { isValid: true }

/**
 * Error raised by the "verifyOrThrow" helpers.
 */
export class WebhookVerificationError extends Error {
  code: WebhookVerificationErrorCode

  constructor(code: WebhookVerificationErrorCode, message?: string) {
    super(message || WEBHOOK_ERROR_MESSAGES[code])
    this.code = code
    this.name = 'WebhookVerificationError'
  }
}

/**
 * Supported webhook signing secrets.
 */
export type WebhookKey = string | Buffer | Secret<string>

/**
 * Context passed to the payload builder.
 */
export type WebhookSignedPayloadContext = {
  payload: WebhookPayload
  headers: Record<string, string>
  webhookId?: string
  timestamp?: number
}

/**
 * Options for creating a custom HMAC webhook verifier.
 */
export type WebhookVerifierOptions = {
  key: WebhookKey | WebhookKey[]
  signatureHeader: string
  signatureEncoding?: 'base64' | 'hex'
  algorithm?: 'sha256' | 'sha1' | 'sha512'
  keyFormat?: 'raw' | 'base64' | 'hex'
  parseSignatures: (
    signatureHeaderValue: string,
    headers: Record<string, string>
  ) => WebhookSignature[]
  buildSignedPayload: (context: WebhookSignedPayloadContext) => string | Buffer
  timestampHeader?: string
  idHeader?: string
  tolerance?: number | string | false
  now?: () => number
}

/**
 * Webhook verifier interface.
 */
export type WebhookVerifier = {
  verify(payload: WebhookPayload, headers: WebhookHeaders): WebhookVerificationResult
  verifyOrThrow(payload: WebhookPayload, headers: WebhookHeaders): WebhookVerificationSuccess
}

/**
 * Options for the Standard Webhooks verifier.
 */
export type StandardWebhookVerifierOptions = {
  format?: 'raw'
  tolerance?: number | string | false
  now?: () => number
}

const WEBHOOK_ERROR_MESSAGES: Record<WebhookVerificationErrorCode, string> = {
  missing_headers: 'Missing required webhook headers.',
  invalid_timestamp: 'Invalid webhook timestamp.',
  timestamp_out_of_range: 'Webhook timestamp is outside the allowed tolerance.',
  invalid_signature_header: 'Invalid webhook signature header.',
  signature_mismatch: 'Webhook signature does not match.',
  unsupported_signature: 'Webhook signature scheme is not supported.',
}

const DEFAULT_STANDARD_TOLERANCE = 5 * 60
const STANDARD_WEBHOOK_ID_HEADER = 'webhook-id'
const STANDARD_WEBHOOK_TIMESTAMP_HEADER = 'webhook-timestamp'
const STANDARD_WEBHOOK_SIGNATURE_HEADER = 'webhook-signature'
const STANDARD_SECRET_PREFIX = 'whsec_'
const STANDARD_PUBLIC_PREFIX = 'whpk_'
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

/**
 * Create a custom HMAC-based webhook verifier.
 */
export function createWebhookVerifier(options: WebhookVerifierOptions): WebhookVerifier {
  if (!options.key || (Array.isArray(options.key) && options.key.length === 0)) {
    throw new Error('Webhook signing key cannot be empty.')
  }

  const signatureHeader = options.signatureHeader.toLowerCase()
  const timestampHeader = options.timestampHeader?.toLowerCase()
  const idHeader = options.idHeader?.toLowerCase()
  const keys = resolveKeyList(options.key, options.keyFormat ?? 'raw')
  const signatureEncoding = options.signatureEncoding ?? 'base64'
  const algorithm = options.algorithm ?? 'sha256'
  const tolerance = resolveTolerance(options.tolerance)

  const verify = (payload: WebhookPayload, headers: WebhookHeaders): WebhookVerificationResult => {
    const normalizedHeaders = normalizeHeaders(headers)
    const signatureHeaderValue = normalizedHeaders[signatureHeader]

    if (!signatureHeaderValue) {
      return { isValid: false, reason: 'missing_headers' }
    }

    const webhookId = idHeader ? normalizedHeaders[idHeader] : undefined
    if (idHeader && !webhookId) {
      return { isValid: false, reason: 'missing_headers' }
    }

    let timestamp: number | undefined
    if (timestampHeader) {
      const rawTimestamp = normalizedHeaders[timestampHeader]
      if (!rawTimestamp) {
        return { isValid: false, reason: 'missing_headers', webhookId }
      }

      timestamp = Number.parseInt(rawTimestamp, 10)
      if (Number.isNaN(timestamp)) {
        return { isValid: false, reason: 'invalid_timestamp', webhookId }
      }
    }

    if (tolerance !== undefined && timestamp !== undefined) {
      const now = options.now ? options.now() : Math.floor(Date.now() / 1000)
      if (Math.abs(now - timestamp) > tolerance) {
        return { isValid: false, reason: 'timestamp_out_of_range', webhookId, timestamp }
      }
    }

    let signatures: WebhookSignature[]
    try {
      signatures = options.parseSignatures(signatureHeaderValue, normalizedHeaders)
    } catch {
      return { isValid: false, reason: 'invalid_signature_header', webhookId, timestamp }
    }

    if (!signatures.length) {
      return { isValid: false, reason: 'invalid_signature_header', webhookId, timestamp }
    }

    const signedPayload = options.buildSignedPayload({
      payload,
      headers: normalizedHeaders,
      webhookId,
      timestamp,
    })

    const signedPayloadBuffer = toBuffer(signedPayload)
    const expectedSignatures = keys.map((key) =>
      createHmac(algorithm, key).update(signedPayloadBuffer).digest(signatureEncoding)
    )

    for (const signature of signatures) {
      if (!signature.signature) {
        continue
      }

      for (const expectedSignature of expectedSignatures) {
        if (safeEqual(signature.signature, expectedSignature)) {
          return { isValid: true, webhookId, timestamp, matchedSignature: signature }
        }
      }
    }

    return { isValid: false, reason: 'signature_mismatch', webhookId, timestamp }
  }

  const verifyOrThrow = (
    payload: WebhookPayload,
    headers: WebhookHeaders
  ): WebhookVerificationSuccess => {
    const result = verify(payload, headers)
    if (!result.isValid) {
      throw new WebhookVerificationError(result.reason!, WEBHOOK_ERROR_MESSAGES[result.reason!])
    }

    return result as WebhookVerificationSuccess
  }

  return { verify, verifyOrThrow }
}

/**
 * Create a Standard Webhooks verifier.
 */
export function createStandardWebhookVerifier(
  secret: WebhookKey | WebhookKey[],
  options: StandardWebhookVerifierOptions = {}
): WebhookVerifier {
  if (!secret || (Array.isArray(secret) && secret.length === 0)) {
    throw new Error('Webhook signing key cannot be empty.')
  }

  const tolerance = resolveTolerance(
    options.tolerance === undefined ? DEFAULT_STANDARD_TOLERANCE : options.tolerance
  )
  const nowFn = options.now ?? (() => Math.floor(Date.now() / 1000))
  const keys = resolveStandardKeys(secret, options.format)
  const hmacKeys = keys.filter((key) => key.type === 'hmac').map((key) => key.key)
  const ed25519Keys = keys.filter((key) => key.type === 'ed25519').map((key) => key.key)

  const verify = (payload: WebhookPayload, headers: WebhookHeaders): WebhookVerificationResult => {
    const normalizedHeaders = normalizeHeaders(headers)
    const webhookId = normalizedHeaders[STANDARD_WEBHOOK_ID_HEADER]
    const timestampHeader = normalizedHeaders[STANDARD_WEBHOOK_TIMESTAMP_HEADER]
    const signatureHeader = normalizedHeaders[STANDARD_WEBHOOK_SIGNATURE_HEADER]

    if (!webhookId || !timestampHeader || !signatureHeader) {
      return { isValid: false, reason: 'missing_headers' }
    }

    const timestamp = Number.parseInt(timestampHeader, 10)
    if (Number.isNaN(timestamp)) {
      return { isValid: false, reason: 'invalid_timestamp', webhookId }
    }

    if (tolerance !== undefined) {
      const now = nowFn()
      if (Math.abs(now - timestamp) > tolerance) {
        return { isValid: false, reason: 'timestamp_out_of_range', webhookId, timestamp }
      }
    }

    const signatures = parseStandardWebhookSignatures(signatureHeader)
    if (!signatures.length) {
      return { isValid: false, reason: 'invalid_signature_header', webhookId, timestamp }
    }

    const signedPayload = buildStandardSignedPayload(payload, webhookId, timestamp)
    const expectedHmacSignatures = hmacKeys.map((key) =>
      createHmac('sha256', key).update(signedPayload).digest('base64')
    )

    let supportedSignatureSeen = false

    for (const signature of signatures) {
      if (signature.scheme === 'v1' && expectedHmacSignatures.length) {
        supportedSignatureSeen = true

        for (const expectedSignature of expectedHmacSignatures) {
          if (safeEqual(signature.signature, expectedSignature)) {
            return { isValid: true, webhookId, timestamp, matchedSignature: signature }
          }
        }
      }

      if (signature.scheme === 'v1a' && ed25519Keys.length) {
        supportedSignatureSeen = true
        const signatureBytes = Buffer.from(signature.signature, 'base64')

        for (const key of ed25519Keys) {
          try {
            if (verifySignature(null, signedPayload, key, signatureBytes)) {
              return { isValid: true, webhookId, timestamp, matchedSignature: signature }
            }
          } catch {
            // Ignore malformed signatures and continue searching.
          }
        }
      }
    }

    if (!supportedSignatureSeen) {
      return { isValid: false, reason: 'unsupported_signature', webhookId, timestamp }
    }

    return { isValid: false, reason: 'signature_mismatch', webhookId, timestamp }
  }

  const verifyOrThrow = (
    payload: WebhookPayload,
    headers: WebhookHeaders
  ): WebhookVerificationSuccess => {
    const result = verify(payload, headers)
    if (!result.isValid) {
      throw new WebhookVerificationError(result.reason!, WEBHOOK_ERROR_MESSAGES[result.reason!])
    }

    return result as WebhookVerificationSuccess
  }

  return { verify, verifyOrThrow }
}

/**
 * Parse Standard Webhooks signature header values.
 */
export function parseStandardWebhookSignatures(signatureHeader: string): WebhookSignature[] {
  const signatures: WebhookSignature[] = []
  const matcher = /([a-z0-9]+),([^\s,]+)/gi

  for (const match of signatureHeader.matchAll(matcher)) {
    signatures.push({ scheme: match[1].toLowerCase(), signature: match[2] })
  }

  return signatures
}

type StandardKey =
  | {
      type: 'hmac'
      key: Buffer
    }
  | {
      type: 'ed25519'
      key: KeyObject
    }

function normalizeHeaders(headers: WebhookHeaders): Record<string, string> {
  const normalized: Record<string, string> = {}

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'undefined') {
      continue
    }

    normalized[key.toLowerCase()] = normalizeHeaderValue(value)
  }

  return normalized
}

function normalizeHeaderValue(value: string | string[]): string {
  if (Array.isArray(value)) {
    return value.join(',')
  }

  return value
}

function resolveTolerance(value?: number | string | false): number | undefined {
  if (value === undefined || value === false) {
    return undefined
  }

  if (typeof value === 'number') {
    return value
  }

  return string.seconds.parse(value)
}

function resolveKeyList(
  keys: WebhookKey | WebhookKey[],
  format: 'raw' | 'base64' | 'hex'
): Buffer[] {
  const list = Array.isArray(keys) ? keys : [keys]
  return list.map((key) => resolveKeyBytes(key, format))
}

function resolveKeyBytes(key: WebhookKey, format: 'raw' | 'base64' | 'hex'): Buffer {
  if (Buffer.isBuffer(key)) {
    return key
  }

  const resolved = key instanceof Secret ? key.release() : key
  if (format === 'raw') {
    return Buffer.from(String(resolved))
  }

  if (format === 'hex') {
    return Buffer.from(String(resolved), 'hex')
  }

  return Buffer.from(String(resolved), 'base64')
}

function resolveStandardKeys(secret: WebhookKey | WebhookKey[], format?: 'raw'): StandardKey[] {
  const secrets = Array.isArray(secret) ? secret : [secret]

  return secrets.map((entry) => {
    if (Buffer.isBuffer(entry)) {
      return { type: 'hmac', key: entry }
    }

    const value = entry instanceof Secret ? entry.release() : entry
    const secretValue = String(value)

    if (format !== 'raw' && secretValue.startsWith(STANDARD_PUBLIC_PREFIX)) {
      const rawPublicKey = Buffer.from(secretValue.slice(STANDARD_PUBLIC_PREFIX.length), 'base64')
      const spkiKey = Buffer.concat([ED25519_SPKI_PREFIX, rawPublicKey])
      return {
        type: 'ed25519',
        key: createPublicKey({ key: spkiKey, format: 'der', type: 'spki' }),
      }
    }

    if (format === 'raw') {
      return { type: 'hmac', key: Buffer.from(secretValue) }
    }

    const stripped = secretValue.startsWith(STANDARD_SECRET_PREFIX)
      ? secretValue.slice(STANDARD_SECRET_PREFIX.length)
      : secretValue
    return { type: 'hmac', key: Buffer.from(stripped, 'base64') }
  })
}

function buildStandardSignedPayload(
  payload: WebhookPayload,
  webhookId: string,
  timestamp: number
): Buffer {
  const payloadBuffer = toBuffer(payload)
  const prefix = Buffer.from(`${webhookId}.${timestamp}.`)
  return Buffer.concat([prefix, payloadBuffer])
}

function toBuffer(value: string | Buffer): Buffer {
  return typeof value === 'string' ? Buffer.from(value) : value
}
