import client from './client'

// Master Console: Seller/Client Management API

export const listClients = () => {
  return client.get('/api/master-console/sellers')
}

export const listActiveClients = () => {
  return client.get('/api/master-console/sellers?active=true')
}

export const listInactiveClients = () => {
  return client.get('/api/master-console/sellers?active=false')
}

export const getClientById = (id) => {
  return client.get(`/api/master-console/sellers/${id}`)
}

export const createClient = (data) => {
  return client.post('/api/master-console/sellers', data)
}

export const updateClient = (id, data) => {
  return client.put(`/api/master-console/sellers/${id}`, data)
}

export const activateClient = (id) => {
  return client.put(`/api/master-console/sellers/${id}/activate`)
}

export const deactivateClient = (id) => {
  return client.put(`/api/master-console/sellers/${id}/deactivate`)
}

export const deleteClient = (id) => {
  return client.delete(`/api/master-console/sellers/${id}`)
}

export const goLiveClient = (id, data) => {
  return client.post(`/api/master-console/sellers/${id}/go-live`, data)
}

export const sendEmailOtp = (id) => {
  return client.post(`/api/master-console/sellers/${id}/send-email-otp`)
}

export const verifyEmailOtp = (id, data) => {
  return client.post(`/api/master-console/sellers/${id}/verify-email-otp`, data)
}

export const sendMobileOtp = (id) => {
  return client.post(`/api/master-console/sellers/${id}/send-mobile-otp`)
}

export const verifyMobileOtp = (id, data) => {
  return client.post(`/api/master-console/sellers/${id}/verify-mobile-otp`, data)
}
