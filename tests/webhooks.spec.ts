/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { createHmac, generateKeyPairSync, sign } from 'node:crypto'
import { createStandardWebhookVerifier, createWebhookVerifier } from '../src/helpers/webhooks.ts'

test.group('Webhook verification', () => {
  test('verify Standard Webhooks signatures', ({ assert }) => {
    const rawSecret = 'super-secret'
    const secret = `whsec_${Buffer.from(rawSecret).toString('base64')}`
    const webhookId = 'msg_2KWPBgLlAfxdpx2AI54pPJ85f4W'
    const timestamp = 1700000000
    const payload = JSON.stringify({ type: 'user.created' })

    const signedPayload = `${webhookId}.${timestamp}.${payload}`
    const signature = createHmac('sha256', Buffer.from(rawSecret))
      .update(signedPayload)
      .digest('base64')

    const verifier = createStandardWebhookVerifier(secret, { now: () => timestamp })
    const result = verifier.verify(payload, {
      'webhook-id': webhookId,
      'webhook-timestamp': String(timestamp),
      'webhook-signature': `v1,${signature}`,
    })

    assert.isTrue(result.isValid)
    assert.equal(result.webhookId, webhookId)
    assert.equal(result.timestamp, timestamp)
  })

  test('verify Standard Webhooks ed25519 signatures', ({ assert }) => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519')
    const spkiPublicKey = publicKey.export({ format: 'der', type: 'spki' }) as Buffer
    const prefix = Buffer.from('302a300506032b6570032100', 'hex')
    const rawPublicKey = spkiPublicKey.subarray(prefix.length)
    const secret = `whpk_${rawPublicKey.toString('base64')}`
    const webhookId = 'msg_ed25519'
    const timestamp = 1700000000
    const payload = JSON.stringify({ type: 'user.updated' })
    const signedPayload = Buffer.from(`${webhookId}.${timestamp}.${payload}`)
    const signature = sign(null, signedPayload, privateKey).toString('base64')

    const verifier = createStandardWebhookVerifier(secret, { now: () => timestamp })
    const result = verifier.verify(payload, {
      'webhook-id': webhookId,
      'webhook-timestamp': String(timestamp),
      'webhook-signature': `v1a,${signature}`,
    })

    assert.isTrue(result.isValid)
    assert.equal(result.matchedSignature?.scheme, 'v1a')
  })

  test('reject unsupported Standard Webhooks schemes', ({ assert }) => {
    const rawSecret = 'super-secret'
    const secret = `whsec_${Buffer.from(rawSecret).toString('base64')}`
    const webhookId = 'msg_unsupported'
    const timestamp = 1700000000
    const payload = JSON.stringify({ type: 'user.deleted' })

    const verifier = createStandardWebhookVerifier(secret, { now: () => timestamp })
    const result = verifier.verify(payload, {
      'webhook-id': webhookId,
      'webhook-timestamp': String(timestamp),
      'webhook-signature': 'v2,deadbeef',
    })

    assert.isFalse(result.isValid)
    assert.equal(result.reason, 'unsupported_signature')
  })

  test('reject when required headers are missing', ({ assert }) => {
    const rawSecret = 'super-secret'
    const secret = `whsec_${Buffer.from(rawSecret).toString('base64')}`
    const verifier = createStandardWebhookVerifier(secret)

    const result = verifier.verify('payload', {})
    assert.isFalse(result.isValid)
    assert.equal(result.reason, 'missing_headers')
  })

  test('reject when timestamp is outside tolerance', ({ assert }) => {
    const rawSecret = 'super-secret'
    const secret = `whsec_${Buffer.from(rawSecret).toString('base64')}`
    const webhookId = 'msg_123'
    const timestamp = 1700000000
    const payload = JSON.stringify({ type: 'invoice.paid' })

    const signedPayload = `${webhookId}.${timestamp}.${payload}`
    const signature = createHmac('sha256', Buffer.from(rawSecret))
      .update(signedPayload)
      .digest('base64')

    const verifier = createStandardWebhookVerifier(secret, {
      now: () => timestamp + 1000,
      tolerance: 10,
    })

    const result = verifier.verify(payload, {
      'webhook-id': webhookId,
      'webhook-timestamp': String(timestamp),
      'webhook-signature': `v1,${signature}`,
    })

    assert.isFalse(result.isValid)
    assert.equal(result.reason, 'timestamp_out_of_range')
  })

  test('verify custom HMAC signatures', ({ assert }) => {
    const payload = 'hello'
    const signature = createHmac('sha256', Buffer.from('custom-secret'))
      .update(payload)
      .digest('hex')

    const verifier = createWebhookVerifier({
      key: 'custom-secret',
      signatureHeader: 'x-signature',
      signatureEncoding: 'hex',
      parseSignatures: (headerValue) => [{ scheme: 'hmac', signature: headerValue }],
      buildSignedPayload: ({ payload: body }) => body,
    })

    const result = verifier.verify(payload, { 'x-signature': signature })
    assert.isTrue(result.isValid)
  })
})
