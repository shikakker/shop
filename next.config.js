const sanityClient = require('@sanity/client')

// see breakdown of code bloat
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Sanity-powered redirects are useful but must not make the storefront build
// depend on CMS credentials or availability.
async function fetchSanityRedirects() {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_PROJECT_DATASET

  if (!projectId || !dataset) {
    return []
  }

  try {
    const client = sanityClient({
      dataset,
      projectId,
      useCdn: process.env.NODE_ENV === 'production',
      apiVersion: '2021-03-25',
    })
    const data = await client.fetch(
      `*[_type == "redirect"]{ from, to, isPermanent }`
    )

    if (!Array.isArray(data)) {
      return []
    }

    return data
      .filter(
        (redirect) =>
          typeof redirect?.from === 'string' &&
          typeof redirect?.to === 'string'
      )
      .map((redirect) => ({
        source: `/${redirect.from}`,
        destination: `/${redirect.to}`,
        permanent: Boolean(redirect.isPermanent),
      }))
  } catch (error) {
    console.warn('Unable to load Sanity redirects during build')
    return []
  }
}

module.exports = withBundleAnalyzer({
  swcMinify: true,
  env: {
    // Public identifiers used by browser-side clients. Server credentials must
    // never be added here because Next.js inlines this object into client code.
    SANITY_PROJECT_DATASET: process.env.SANITY_PROJECT_DATASET,
    SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
    SHOPIFY_STORE_ID: process.env.SHOPIFY_STORE_ID,
    SHOPIFY_STOREFRONT_API_TOKEN: process.env.SHOPIFY_STOREFRONT_API_TOKEN,
    YOTPO_API_KEY: process.env.YOTPO_API_KEY,
  },
  async redirects() {
    return fetchSanityRedirects()
  },
  async headers() {
    return [
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self';",
          },
        ],
      },
    ]
  },
})
