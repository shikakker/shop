import { timingSafeEqual } from 'node:crypto'
import { getDynamicRoute, getStaticRoute } from '@lib/routes'

const SAFE_SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/

function secretsMatch(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') {
    return false
  }

  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  )
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const previewSecret = process.env.SANITY_PREVIEW_SECRET
  if (!previewSecret || !secretsMatch(req.query.token, previewSecret)) {
    return res.status(401).json({ message: 'Invalid preview request' })
  }

  if (typeof req.query.type !== 'string') {
    return res.status(400).json({ message: 'Invalid preview target' })
  }

  const staticRoute = getStaticRoute(req.query.type)
  const dynamicRoute = getDynamicRoute(req.query.type)

  if (staticRoute) {
    res.setPreviewData({ active: true }, { maxAge: 20 })
    return res.redirect(`/${staticRoute}`)
  }

  if (
    !dynamicRoute ||
    typeof req.query.slug !== 'string' ||
    !SAFE_SLUG.test(req.query.slug)
  ) {
    return res.status(400).json({ message: 'Invalid preview target' })
  }

  res.setPreviewData({ active: true }, { maxAge: 20 })
  return res.redirect(`/${dynamicRoute}/${req.query.slug}`)
}
