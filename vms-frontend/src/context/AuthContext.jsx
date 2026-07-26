import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vms_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((profile) => setUser(profile))
      .catch(() => {
        localStorage.removeItem('vms_token')
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { token } = await authApi.login(email, password)
    localStorage.setItem('vms_token', token)
    const profile = await authApi.me()
    setUser(profile)
    return profile
  }

  function logout() {
    localStorage.removeItem('vms_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
