import client from './client'

export async function listStorageConfigs(sellerId) {
  const res = await client.get(`/api/storage-configs/seller/${sellerId}`)
  return res.data
}

export async function saveStorageConfig(payload) {
  // payload: { id?, seller: {id}, platform: {id} | null, providerType, credentialsJson, videoNamingSource, active }
  const res = await client.post('/api/storage-configs', payload)
  return res.data
}

export async function deleteStorageConfig(id) {
  await client.delete(`/api/storage-configs/${id}`)
}
