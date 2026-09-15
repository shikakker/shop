import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const productUpdate = await readFile(new URL('../pages/api/shopify/product-update.js', import.meta.url), 'utf8')

test('product sync uses the Node deep equality primitive instead of vulnerable jsondiffpatch', () => {
  assert.equal(pkg.dependencies.jsondiffpatch, undefined)
  assert.doesNotMatch(productUpdate, /jsondiffpatch/)
  assert.match(productUpdate, /isDeepStrictEqual/)
})
