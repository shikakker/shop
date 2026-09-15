import createSanityClient from '@sanity/client'
import sanityImage from '@sanity/image-url'

function getBaseOptions() {
  const dataset = process.env.SANITY_PROJECT_DATASET
  const projectId = process.env.SANITY_PROJECT_ID

  if (!dataset || !projectId) {
    return null
  }

  return {
    dataset,
    projectId,
    useCdn: process.env.NODE_ENV === 'production',
    apiVersion: '2021-03-25',
  }
}

export function isSanityConfigured() {
  return Boolean(getBaseOptions())
}

export function createPublishedClient() {
  const options = getBaseOptions()
  if (!options) {
    return null
  }

  return createSanityClient(options)
}

export const imageBuilder = {
  image(source) {
    const client = createPublishedClient()
    if (!client) {
      return null
    }
    return sanityImage(client).image(source)
  },
}

export function createPreviewClient() {
  const options = getBaseOptions()
  const token = process.env.SANITY_API_TOKEN

  if (!options || !token) {
    throw new Error('SANITY_PREVIEW_NOT_CONFIGURED')
  }

  return createSanityClient({
    ...options,
    useCdn: false,
    token,
  })
}

export function getSanityClient(preview) {
  if (preview?.active) {
    return createPreviewClient()
  }

  const client = createPublishedClient()
  if (!client) {
    throw new Error('SANITY_NOT_CONFIGURED')
  }

  return client
}
