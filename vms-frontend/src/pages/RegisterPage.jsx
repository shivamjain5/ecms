import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import * as authApi from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { defaultRouteForRole } from '../config/roleAccess'

const ROLES = [
  { value: 'ADMIN', label: 'Admin — manages sellers, platforms, storage' },
  { value: 'SELLER_OWNER', label: 'Seller Owner — owns a seller account' },
  { value: 'PACKING_STAFF', label: 'Packing Staff — records packing videos' },
  { value: 'VIEWER', label: 'Viewer — read-only access' },
]

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('PACKING_STAFF')
  const [sellerId, setSellerId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const needsSeller = role !== 'ADMIN'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.register({
        email,
        password,
        fullName,
        role,
        sellerId: needsSeller && sellerId ? Number(sellerId) : null,
      })
      // Registration returns a token too, but we log in fresh so AuthContext
      // fetches the full profile (/api/auth/me) consistently.
      await login(email, password)
      navigate(defaultRouteForRole(role))
    } catch (err) {
      setError('Could not create the account. The email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--paper-0)' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card"
        style={{ width: 440, padding: '40px 36px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={18} color="var(--ink-900)" strokeWidth={2.4} />
          </div>
          <h2 style={{ fontSize: 20 }}>Create an account</h2>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--slate-600)', marginBottom: 24 }}>
          For internal onboarding — ask your admin for a Seller ID if you're not an Admin.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="fullName">Full name</label>
            <input id="fullName" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="role">Role</label>
            <select id="role" className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {needsSeller && (
            <div style={{ marginBottom: 20 }}>
              <label className="label" htmlFor="sellerId">Seller ID</label>
              <input
                id="sellerId"
                className="input mono"
                placeholder="e.g. 1"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--red-100)', color: 'var(--red-500)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ fontSize: 12.5, color: 'var(--slate-400)', marginTop: 22, textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--ink-900)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
