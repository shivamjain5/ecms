import client from './client'

// Master Console: Storage Configuration Management API

export const listStorageConfigs = () => {
  return client.get('/api/master-console/storage-configs')
}

export const getConfigsByClient = (sellerId) => {
  return client.get(`/api/master-console/storage-configs/seller/${sellerId}`)
}

export const createStorageConfig = (data) => {
  return client.post('/api/master-console/storage-configs', data)
}

export const updateStorageConfig = (id, data) => {
  return client.put(`/api/master-console/storage-configs/${id}`, data)
}

export const activateConfig = (id) => {
  return client.put(`/api/master-console/storage-configs/${id}/activate`)
}

export const deactivateConfig = (id) => {
  return client.put(`/api/master-console/storage-configs/${id}/deactivate`)
}

export const deleteConfig = (id) => {
  return client.delete(`/api/master-console/storage-configs/${id}`)
}
