import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const [security, productDelete, productUpdate, productImages, inventory] = await Promise.all([
  read('../lib/shopify-security.js').catch(() => ''),
  read('../pages/api/shopify/product-delete.js'),
  read('../pages/api/shopify/product-update.js'),
  read('../pages/api/shopify/product-images.js'),
  read('../pages/api/shopify/product-inventory.js'),
])

test('Shopify webhook verifier authenticates the raw body before JSON parsing', () => {
  assert.match(security, /getRawBody/)
  assert.match(security, /createHmac/)
  assert.match(security, /timingSafeEqual/)
  assert.match(security, /JSON\.parse/)
  assert.match(security, /SHOPIFY_WEBHOOK_INTEGRITY/)
  assert.doesNotMatch(productDelete, /runMiddleware/)
  assert.doesNotMatch(productUpdate, /runMiddleware/)
  assert.match(productDelete, /readVerifiedShopifyWebhook/)
  assert.match(productUpdate, /readVerifiedShopifyWebhook/)
})

test('webhook routes reject non-POST and unauthenticated deliveries with proper status classes', () => {
  for (const route of [productDelete, productUpdate]) {
    assert.match(route, /req\.method !== ['"]POST['"]/)
    assert.match(route, /status\(405\)/)
    assert.match(route, /verified\.status/)
  }
})

test('admin image sync is POST-only, same-origin by default and requires a server sync secret', () => {
  assert.match(productImages, /req\.method !== ['"]POST['"]/)
  assert.match(productImages, /status\(405\)/)
  assert.match(productImages, /verifyShopifySyncSecret/)
  assert.match(security, /SHOPIFY_SYNC_SECRET/)
  assert.doesNotMatch(productImages, /Access-Control-Allow-Origin['"], ['"]\*['"]/)
})

test('inventory proxy validates method and numeric product IDs with recoverable statuses', () => {
  assert.match(inventory, /req\.method !== ['"]GET['"]/)
  assert.match(inventory, /status\(405\)/)
  assert.match(inventory, /PRODUCT_ID/)
  assert.match(inventory, /status\(400\)/)
  assert.match(inventory, /status\(503\)/)
  assert.match(inventory, /status\(404\)/)
})
