import { createHmac, timingSafeEqual } from 'crypto'
const getRawBody = require('raw-body')

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || ''))
  const b = Buffer.from(String(right || ''))
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function readVerifiedShopifyWebhook(req) {
  const secret = process.env.SHOPIFY_WEBHOOK_INTEGRITY
  if (!secret) {
    return { ok: false, status: 503, error: 'Shopify webhook verification is not configured' }
  }

  const supplied = req.headers['x-shopify-hmac-sha256']
  if (typeof supplied !== 'string' || !supplied) {
    return { ok: false, status: 401, error: 'Unable to verify Shopify webhook' }
  }

  let rawBody
  try {
    rawBody = await getRawBody(req, { limit: '2mb' })
  } catch {
    return { ok: false, status: 413, error: 'Shopify webhook payload is too large' }
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('base64')
  if (!safeEqual(supplied, expected)) {
    return { ok: false, status: 401, error: 'Unable to verify Shopify webhook' }
  }

  try {
    return { ok: true, status: 200, body: JSON.parse(rawBody.toString('utf8')) }
  } catch {
    return { ok: false, status: 400, error: 'Invalid Shopify webhook JSON' }
  }
}

export function verifyShopifySyncSecret(req) {
  const secret = process.env.SHOPIFY_SYNC_SECRET
  if (!secret) {
    return { ok: false, status: 503, error: 'Shopify sync is not configured' }
  }

  const supplied = req.headers['x-shopify-sync-secret']
  if (typeof supplied !== 'string' || !safeEqual(supplied, secret)) {
    return { ok: false, status: 401, error: 'Unauthorized Shopify sync request' }
  }

  return { ok: true, status: 200 }
}
