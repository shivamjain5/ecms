import axios from 'axios'

/**
 * Master Console Axios Client
 * Configured to call Master Console Backend on port 8081
 * All requests include JWT token in Authorization header
 */
const client = axios.create({
  baseURL: 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add JWT token to all requests
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('master_console_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle response errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      localStorage.removeItem('master_console_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
