import client from './client'

export async function login(email, password) {
  console.log('[auth] login request', { email, password })
  try {
    const res = await client.post('/api/auth/login', { email, password })
    console.log('[auth] login success', { email, role: res.data?.role })
    return res.data // { token, email, role }
  } catch (error) {
    console.error('[auth] login failed', { email, password, error })
    throw error
  }
}

export async function register(payload) {
  console.log('[auth] register request', { email: payload.email, role: payload.role })
  try {
    const res = await client.post('/api/auth/register', payload)
    console.log('[auth] register success', { email: payload.email, role: res.data?.role })
    return res.data
  } catch (error) {
    console.error('[auth] register failed', { email: payload.email, error })
    throw error
  }
}

export async function me() {
  const res = await client.get('/api/auth/me')
  return res.data // { userId, email, fullName, role, sellerId, sellerName }
}
