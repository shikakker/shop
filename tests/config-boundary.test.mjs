import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const config = await readFile(new URL('../next.config.js', import.meta.url), 'utf8')

const serverOnlyNames = [
  'SANITY_API_TOKEN',
  'SANITY_PREVIEW_SECRET',
  'KLAVIYO_API_KEY',
  'YOTPO_SECRET_KEY',
  'MAILCHIMP_API_KEY',
  'SENDGRID_API_KEY',
]

test('Next config does not expose server-only provider credentials through the public env bundle', () => {
  const envBlock = config.match(/env:\s*\{([\s\S]*?)\n\s*\},\n\s*async redirects/)
  assert.ok(envBlock, 'expected an explicit public env block')
  for (const name of serverOnlyNames) {
    assert.doesNotMatch(envBlock[1], new RegExp(name))
  }
})

test('Sanity redirect client is created lazily only when public CMS identifiers are configured', () => {
  assert.doesNotMatch(config, /^const client = sanityClient/m)
  assert.match(config, /if\s*\(!projectId\s*\|\|\s*!dataset\)\s*\{?\s*return \[\]/)
  assert.match(config, /async function fetchSanityRedirects/)
})

test('redirect provider failure does not take down the storefront build', () => {
  assert.match(config, /catch\s*\(/)
  assert.match(config, /return \[\]/)
})
