import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const header = await readFile(new URL('../components/header.js', import.meta.url), 'utf8')
const megaNav = await readFile(new URL('../components/menu-mega-nav.js', import.meta.url), 'utf8')
const marquee = await readFile(new URL('../components/modules/marquee.js', import.meta.url), 'utf8')
const carousel = await readFile(new URL('../components/carousel.js', import.meta.url), 'utf8')

test('header and mega navigation do not depend on the React-17-only @reach/rect adapter', () => {
  assert.doesNotMatch(header, /@reach\/rect/)
  assert.doesNotMatch(megaNav, /@reach\/rect/)
  assert.match(header, /useElementRect/)
  assert.match(megaNav, /useElementRect/)
})

test('marquee uses the local track implementation instead of the React-17-only marqy package', () => {
  assert.doesNotMatch(marquee, /from ['"]marqy['"]/)
  assert.match(marquee, /data-marqy/)
  assert.match(marquee, /prefers-reduced-motion|aria-hidden/)
})

test('carousel keeps the maintained Embla React adapter', () => {
  assert.match(carousel, /embla-carousel-react/)
  assert.match(carousel, /watchDrag/)
})
