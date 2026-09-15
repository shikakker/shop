import axios from 'axios'

export default async function send(req, res) {
  if (req.method !== 'POST') {
    return res.status(404).json({ error: 'must be a POST request' })
  }

  const {
    body: { accountID, email, variant },
  } = req

  // honeypot
  if (req.body.fullname !== '') {
    console.warn('Stuck in honey 🍯')
    return res.status(200).json({ status: 202 })
  }

  if (!email || !accountID) {
    console.warn('No email or account ID provided')
    return res
      .status(404)
      .json({ error: 'Must contain an email address and account ID' })
  }

  const payload = new URLSearchParams({
    a: String(accountID),
    platform: 'shopify',
    email: String(email),
  })

  if (variant !== undefined && variant !== null) {
    payload.set('variant', String(variant))
  }

  const options = {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: payload.toString(),
    url: 'https://a.klaviyo.com/api/v1/catalog/subscribe',
  }

  const waitlistData = await axios(options).then((res) => res.data)

  res.statusCode = 200
  res.json(waitlistData)
}
