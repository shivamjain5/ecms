import client from './client'

export async function listSellers() {
  const res = await client.get('/api/sellers')
  return res.data
}

export async function createSeller(payload) {
  const res = await client.post('/api/sellers', payload)
  return res.data
}

export async function updateSeller(id, payload) {
  const res = await client.put(`/api/sellers/${id}`, payload)
  return res.data
}

export async function activateSeller(id) {
  await client.put(`/api/sellers/${id}/activate`)
}

export async function deactivateSeller(id) {
  await client.put(`/api/sellers/${id}/deactivate`)
}

/**
 * Get the current seller's own profile.
 * Available to SELLER_OWNER and VIEWER roles.
 */
export async function getMyProfile() {
  const res = await client.get('/api/sellers/me')
  return res.data
}

/**
 * Update the current seller's profile (business name, contact phone).
 * Available to SELLER_OWNER role only.
 */
export async function updateMyProfile(payload) {
  const res = await client.put('/api/sellers/me', payload)
  return res.data
}

