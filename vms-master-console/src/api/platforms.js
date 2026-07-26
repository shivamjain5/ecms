import client from './client'

// Master Console: Global Platform Management API

export const listPlatforms = () => {
  return client.get('/api/master-console/ecom-platforms')
}

export const listActivePlatforms = () => {
  return client.get('/api/master-console/ecom-platforms/active')
}

export const listInactivePlatforms = () => {
  return client.get('/api/master-console/ecom-platforms/inactive')
}

export const getPlatformById = (id) => {
  return client.get(`/api/master-console/ecom-platforms/${id}`)
}

export const createPlatform = (data) => {
  return client.post('/api/master-console/ecom-platforms', data)
}

export const updatePlatform = (id, data) => {
  return client.put(`/api/master-console/ecom-platforms/${id}`, data)
}

export const activatePlatform = (id) => {
  return client.put(`/api/master-console/ecom-platforms/${id}/activate`)
}

export const deactivatePlatform = (id) => {
  return client.put(`/api/master-console/ecom-platforms/${id}/deactivate`)
}

export const deletePlatform = (id) => {
  return client.delete(`/api/master-console/ecom-platforms/${id}`)
}
