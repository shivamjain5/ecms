import client from './client'

export async function listActivePlatforms() {
  const res = await client.get('/api/ecom-platforms')
  return res.data // [{ id, code, displayName, active }]
}

export async function listInactivePlatforms() {
  const res = await client.get('/api/ecom-platforms/inactive')
  return res.data
}

export async function createPlatform(payload) {
  const res = await client.post('/api/ecom-platforms', payload)
  return res.data
}

export async function deactivatePlatform(id) {
  await client.put(`/api/ecom-platforms/${id}/deactivate`)
}

export async function activatePlatform(id) {
  await client.put(`/api/ecom-platforms/${id}/activate`)
}
