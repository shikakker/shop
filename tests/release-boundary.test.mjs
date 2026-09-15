import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const queries = await readFile(new URL('../data/queries.js', import.meta.url), 'utf8')

test('storefront production build does not depend on Sanity Studio compilation', () => {
  assert.equal(pkg.scripts.build, 'next build')
  assert.ok(pkg.scripts['build:studio'])
  assert.match(pkg.scripts['build:studio'], /sanity build/)
})

test('production dependency install does not implicitly install the legacy Studio toolchain', () => {
  assert.notEqual(typeof pkg.scripts.postinstall, 'string')
})

test('storefront data queries do not import Sanity Studio schema or UI modules', () => {
  assert.doesNotMatch(queries, /studio\/schemas/)
  assert.match(queries, /shop-sort-types/)
})

test('unused vulnerable query-string dependency is not part of the storefront graph', () => {
  assert.equal(pkg.dependencies['query-string'], undefined)
})

test('release scripts expose deterministic verification hooks', () => {
  assert.equal(pkg.scripts.test, 'node --test tests/*.test.mjs')
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit')
})
