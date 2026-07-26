import axios from 'axios'

// Resolve tenant using master-console backend where tenants are stored
export const resolveTenant = (companyName) => {
  const url = 'http://localhost:8081/api/master-console/resolve'
  return axios.post(url, { companyName })
}
