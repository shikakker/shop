import axios from 'axios'
import sanityClient from '@sanity/client'
import { isDeepStrictEqual } from 'node:util'
import { nanoid } from 'nanoid'
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

  const { status, id, title, handle, options = [], variants = [] } =
    verified.body || {}
  if (!id || !title || !handle || !Array.isArray(options) || !variants.length) {
    return res.status(400).json({ error: 'Invalid Shopify product payload' })
  }

  console.info(`Sync triggered for product: ${title} (id: ${id})`)

  const product = {
    _type: 'product',
    _id: `product-${id}`,
  }

  const productOptions =
    variants.length > 1
      ? options.map((option) => ({
          _key: option.id,
          _type: 'productOption',
          name: option.name,
          values: option.values,
          position: option.position,
        }))
      : []

  const productFields = {
    wasDeleted: false,
    isDraft: status === 'draft',
    productTitle: title,
    productID: id,
    slug: { current: handle },
    price: Number(variants[0].price || 0) * 100,
    comparePrice: Number(variants[0].compare_at_price || 0) * 100,
    sku: variants[0].sku || '',
    inStock: variants.some(
      (v) => v.inventory_quantity > 0 || v.inventory_policy === 'continue'
    ),
    lowStock:
      variants.reduce((a, b) => a + (b.inventory_quantity || 0), 0) <= 10,
    options: productOptions,
  }

  const productVariants = variants
    .sort((a, b) => (a.id > b.id ? 1 : -1))
    .map((variant) => ({
      _type: 'productVariant',
      _id: `productVariant-${variant.id}`,
    }))

  const productVariantFields = variants
    .sort((a, b) => (a.id > b.id ? 1 : -1))
    .map((variant) => ({
      isDraft: status === 'draft',
      wasDeleted: false,
      productTitle: title,
      productID: id,
      variantTitle: variant.title,
      variantID: variant.id,
      price: Number(variant.price || 0) * 100,
      comparePrice: Number(variant.compare_at_price || 0) * 100,
      sku: variant.sku || '',
      inStock:
        variant.inventory_quantity > 0 ||
        variant.inventory_policy === 'continue',
      lowStock: variant.inventory_quantity <= 5,
      options:
        variants.length > 1
          ? options.map((option) => ({
              _key: option.id,
              _type: 'productOptionValue',
              name: option.name,
              value: variant[`option${option.position}`],
              position: option.position,
            }))
          : [],
    }))

  const productCompare = {
    ...product,
    ...productFields,
    variants: productVariants.map((variant, key) => ({
      ...variant,
      ...productVariantFields[key],
    })),
  }

  if (!process.env.SHOPIFY_STORE_ID || !process.env.SHOPIFY_ADMIN_API_TOKEN) {
    return res.status(503).json({ error: 'Shopify Admin API is not configured' })
  }

  const shopifyConfig = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN,
  }

  try {
    const shopifyProduct = await axios({
      url: `https://${process.env.SHOPIFY_STORE_ID}.myshopify.com/admin/products/${id}/metafields.json`,
      method: 'GET',
      headers: shopifyConfig,
    })

    const previousSync = shopifyProduct.data?.metafields.find(
      (mf) => mf.key === 'product_sync'
    )

    if (previousSync) {
      if (!isDeepStrictEqual(JSON.parse(previousSync.value), productCompare)) {
        await axios({
          url: `https://${process.env.SHOPIFY_STORE_ID}.myshopify.com/admin/products/${id}/metafields/${previousSync.id}.json`,
          method: 'PUT',
          headers: shopifyConfig,
          data: {
            metafield: {
              id: previousSync.id,
              value: JSON.stringify(productCompare),
              value_type: 'string',
            },
          },
        })
      } else {
        return res.status(200).json({ status: 'up-to-date' })
      }
    } else {
      await axios({
        url: `https://${process.env.SHOPIFY_STORE_ID}.myshopify.com/admin/products/${id}/metafields.json`,
        method: 'POST',
        headers: shopifyConfig,
        data: {
          metafield: {
            namespace: 'sanity',
            key: 'product_sync',
            value: JSON.stringify(productCompare),
            value_type: 'string',
          },
        },
      })
    }

    let stx = sanity.transaction()
    stx = stx.createIfNotExists(product)
    stx = stx.patch(`product-${id}`, (patch) => patch.unset(['options']))
    stx = stx.patch(`product-${id}`, (patch) => patch.set(productFields))
    stx = stx.patch(`product-${id}`, (patch) => patch.setIfMissing({ title }))
    stx = stx.patch(`product-${id}`, (patch) =>
      patch.setIfMissing({
        modules: [
          {
            _key: nanoid(),
            _type: 'productHero',
            active: true,
          },
        ],
      })
    )

    productVariants.forEach((variant, i) => {
      stx = stx.createIfNotExists(variant)
      stx = stx.patch(variant._id, (patch) => patch.set(productVariantFields[i]))
      stx = stx.patch(variant._id, (patch) =>
        patch.setIfMissing({ title: productVariantFields[i].variantTitle })
      )
    })

    const currentVariants = await sanity.fetch(
      `*[_type == "productVariant" && productID == ${Number(id)}]{_id}`
    )

    currentVariants.forEach((cv) => {
      const active = productVariants.some((v) => v._id === cv._id)
      if (!active) {
        stx = stx.patch(cv._id, (patch) => patch.set({ wasDeleted: true }))
      }
    })

    const result = await stx.commit()
    return res.status(200).json(result)
  } catch {
    return res.status(502).json({ error: 'Shopify/Sanity sync failed' })
  }
}
