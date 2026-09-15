import axios from 'axios'

export default async function send(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id
  const productId = Number(rawId)
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'Valid numeric product ID required' })
  }

  if (!process.env.SHOPIFY_STORE_ID || !process.env.SHOPIFY_ADMIN_API_TOKEN) {
    return res.status(503).json({ error: 'Shopify API not configured' })
  }

  const shopifyConfig = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN,
  }

  let shopifyProduct
  try {
    const response = await axios({
      url: `https://${process.env.SHOPIFY_STORE_ID}.myshopify.com/admin/api/2021-01/products/${productId}.json`,
      method: 'GET',
      headers: shopifyConfig,
      timeout: 10000,
      validateStatus: () => true,
    })

    if (response.status === 404) {
      return res.status(404).json({ error: 'Product not found' })
    }
    if (response.status < 200 || response.status >= 300) {
      return res.status(502).json({ error: 'Shopify inventory request failed' })
    }
    shopifyProduct = response.data?.product
  } catch {
    return res.status(502).json({ error: 'Shopify inventory request failed' })
  }

  if (!shopifyProduct?.variants?.length) {
    return res.status(404).json({ error: 'Product not found' })
  }

  const variants = shopifyProduct.variants
  const product = {
    inStock: variants.some(
      (v) =>
        v.inventory_quantity > 0 ||
        v.inventory_policy === 'continue' ||
        v.inventory_management === null
    ),
    lowStock:
      variants.reduce((a, b) => a + (b.inventory_quantity || 0), 0) <= 10,
    variants: variants.map((variant) => ({
      id: variant.id,
      inStock:
        variant.inventory_quantity > 0 ||
        variant.inventory_policy === 'continue' ||
        variant.inventory_management === null,
      lowStock: variant.inventory_quantity <= 5,
    })),
  }

  return res.status(200).json(product)
}
