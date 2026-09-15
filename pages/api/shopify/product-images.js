import sanityClient from '@sanity/client'
import axios from 'axios'

import { queries } from '@data'
import { buildSrc } from '@lib/helpers'
import { verifyShopifySyncSecret } from '../../../lib/shopify-security'

const sanity = sanityClient({
  dataset: process.env.SANITY_PROJECT_DATASET,
  projectId: process.env.SANITY_PROJECT_ID,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2021-03-25',
  useCdn: false,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const verified = verifyShopifySyncSecret(req)
  if (!verified.ok) {
    return res.status(verified.status).json({ error: verified.error })
  }

  const { productID, cartPhotos } = req.body || {}
  if (!Number.isSafeInteger(Number(productID)) || !cartPhotos?.length) {
    return res.status(400).json({
      error: 'A valid Product ID and Cart Thumbnails are required',
    })
  }

  if (!process.env.SHOPIFY_STORE_ID || !process.env.SHOPIFY_ADMIN_API_TOKEN) {
    return res.status(503).json({ error: 'Shopify Admin API is not configured' })
  }

  try {
    const product = await sanity.fetch(
      `*[_type == "product" && productID == ${Number(productID)}][0]{
        "variants": *[_type == "productVariant" && productID == ${Number(productID)}]{
          variantID,
          options[]{name,value}
        },
        cartPhotos[]{
          forOption,
          "default": cartPhoto{${queries.imageMeta}}
        }
      }`
    )

    if (!product?.cartPhotos?.length || !Array.isArray(product.variants)) {
      return res.status(404).json({ error: 'Product image configuration not found' })
    }

    const hasVariantPhotos =
      product.cartPhotos.length > 1 ||
      product.cartPhotos.some((set) => set.forOption)

    const variantPhotoSets = product.cartPhotos.map((set) => {
      const optName = set.forOption?.split(':')[0]
      const optValue = set.forOption?.split(':')[1]
      const newVariants = product.variants.filter((v) =>
        v.options?.some((opt) => opt.name === optName && opt.value === optValue)
      )

      return {
        variants: newVariants,
        photo: set.default,
      }
    })

    const generateSrc = (asset) => buildSrc(asset, { width: 800, height: 800 })
    const shopifyConfig = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN,
    }

    const shopifyProduct = await axios({
      url: `https://${process.env.SHOPIFY_STORE_ID}.myshopify.com/admin/api/2021-04/products/${productID}.json`,
      method: 'PUT',
      headers: shopifyConfig,
      data: {
        product: {
          id: productID,
          images: hasVariantPhotos
            ? variantPhotoSets.map((set) => ({
                src: generateSrc(set.photo),
                variant_ids: set.variants.map((v) => v.variantID),
              }))
            : [{ src: generateSrc(product.cartPhotos[0].default) }],
        },
      },
    }).then((response) => response.data)

    return res.status(200).json(shopifyProduct)
  } catch {
    return res.status(502).json({ error: 'Shopify image sync failed' })
  }
}
