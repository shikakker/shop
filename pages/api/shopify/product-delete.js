import sanityClient from '@sanity/client'
import { readVerifiedShopifyWebhook } from '../../../lib/shopify-security'

const sanity = sanityClient({
  dataset: process.env.SANITY_PROJECT_DATASET,
  projectId: process.env.SANITY_PROJECT_ID,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2021-03-25',
  useCdn: false,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function send(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const verified = await readVerifiedShopifyWebhook(req)
  if (!verified.ok) {
    return res.status(verified.status).json({ error: verified.error })
  }

  const { id, title } = verified.body || {}
  if (!Number.isSafeInteger(Number(id)) || !id) {
    return res.status(400).json({ error: 'Invalid Shopify product ID' })
  }

  console.log(`Deleting product from Sanity: ${title || 'Untitled'} (id: ${id})`)
  let stx = sanity.transaction()
  stx = stx.patch(`product-${id}`, (patch) => patch.set({ wasDeleted: true }))

  try {
    const result = await stx.commit()
    console.info('Sync complete!')
    return res.status(200).json(result)
  } catch {
    return res.status(502).json({ error: 'Unable to update product state' })
  }
}
