import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const previewRoute = await readFile(new URL('../pages/api/preview.js', import.meta.url), 'utf8')
const sanity = await readFile(new URL('../lib/sanity.js', import.meta.url), 'utf8')

test('preview access uses a server environment secret instead of the inherited HULL token', () => {
  assert.match(previewRoute, /SANITY_PREVIEW_SECRET/)
  assert.doesNotMatch(previewRoute, /['"]HULL['"]/) 
})

test('Sanity API token stays server-side instead of being written into preview cookies', () => {
  assert.doesNotMatch(previewRoute, /setPreviewData\([\s\S]*SANITY_API_TOKEN/)
  assert.match(sanity, /process\.env\.SANITY_API_TOKEN/)
})

test('preview redirects validate dynamic route type and a single safe slug segment', () => {
  assert.match(previewRoute, /getDynamicRoute/)
  assert.match(previewRoute, /SAFE_SLUG/)
  assert.match(previewRoute, /Invalid preview target/)
})

test('preview responses are private and non-cacheable', () => {
  assert.match(previewRoute, /Cache-Control/)
  assert.match(previewRoute, /no-store/)
})
