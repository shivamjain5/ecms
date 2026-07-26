import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PackageSearch, ShieldCheck, Camera, FolderCog } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { defaultRouteForRole } from '../config/roleAccess'

function BarcodeStripes() {
  // Deterministic pseudo-random stripe widths so it reads as a real barcode, not noise.
  const widths = [3, 1, 2, 1, 4, 2, 1, 3, 1, 1, 2, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 2, 1, 1, 4, 2, 3, 1, 2, 1]
  return (
    <div className="barcode-stripes">
      {widths.map((w, i) => (
        <span key={i} style={{ width: `${w * 4}px` }} />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    console.log('[LoginPage] login attempt', { email })
    try {
      const profile = await login(email, password)
      console.log('[LoginPage] login success', { email, role: profile.role })
      navigate(defaultRouteForRole(profile.role))
    } catch (err) {
      console.error('[LoginPage] login failure', { email, error: err })
      setError('Could not sign in. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  // Company selection removed — using configured DB schema for tenant

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left hero panel -- signature scanline motif */}
      <div
        className="scanline-wrap"
        style={{
          flex: '0 0 44%',
          background: 'linear-gradient(160deg, var(--ink-900), var(--ink-700))',
          color: 'white',
          padding: '52px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div className="scanline-beam" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 9,
              background: 'var(--amber-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PackageSearch size={22} color="var(--ink-900)" strokeWidth={2.4} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>VMS</div>
        </div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ color: 'white', fontSize: 34, lineHeight: 1.15, marginBottom: 14 }}
          >
            Pack it. Prove it.<br />Protect every claim.
          </motion.h1>
          <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 14.5, maxWidth: 380, lineHeight: 1.6, marginBottom: 28 }}>
            Every order gets a scanned, timestamped video record — sorted by
            marketplace, stored where you choose, ready the moment a return claim lands.
          </p>

          <div style={{ height: 46, marginBottom: 28, opacity: 0.9 }}>
            <BarcodeStripes />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FeatureRow icon={Camera} text="Barcode-triggered packing video capture" />
            <FeatureRow icon={FolderCog} text="Drive, S3, or local storage — switch anytime, no code" />
            <FeatureRow icon={ShieldCheck} text="Return-claim proof, organized per marketplace" />
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>© {new Date().getFullYear()} VMS Operations</div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper-0)' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card"
          style={{ width: 380, padding: '40px 36px' }}
        >
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Sign in</h2>
          <p style={{ fontSize: 13.5, color: 'var(--slate-600)', marginBottom: 26 }}>
            Access your packing, CCTV, and dashboard console.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Company selection removed — sign in with email/password only */}
            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ background: 'var(--red-100)', color: 'var(--red-500)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ fontSize: 12.5, color: 'var(--slate-400)', marginTop: 22, textAlign: 'center' }}>
            No account yet? <Link to="/register" style={{ color: 'var(--ink-900)', fontWeight: 600 }}>Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function FeatureRow({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={14} color="var(--amber-500)" />
      </div>
      <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)' }}>{text}</span>
    </div>
  )
}
