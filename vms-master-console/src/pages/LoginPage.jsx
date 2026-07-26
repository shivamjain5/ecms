import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackageSearch, ShieldCheck, Camera, FolderCog } from 'lucide-react'

function Badge({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.12)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon size={16} color="rgb(251 191 36)" />
      </div>
      <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14 }}>{label}</span>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('master@vms.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (localStorage.getItem('master_console_token')) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (email.trim().toLowerCase() === 'master@vms.com' && password === '123456') {
        localStorage.setItem('master_console_token', 'master-console-demo-token')
        navigate('/dashboard', { replace: true })
      } else {
        setError('Invalid credentials. Use master@vms.com / 123456.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--slate-50)' }}>
      <div
        style={{
          flex: '0 0 45%',
          minHeight: '100vh',
          padding: '56px',
          background: 'linear-gradient(110deg, #0f172a 25%, #152443 60%, #0f172a 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 38 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'var(--amber-500)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <PackageSearch size={24} color="#0f172a" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.06em' }}>VMS</span>
          </div>

          <h1 style={{ fontSize: 44, lineHeight: 1.05, fontWeight: 800, marginBottom: 22 }}>
            Pack it. Prove it.<br />Protect every claim.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.74)', maxWidth: 420, fontSize: 15, lineHeight: 1.8 }}>
            Every order gets a scanned, timestamped video record — sorted by marketplace, stored where you choose, ready the moment a return claim lands.
          </p>

          <div style={{ marginTop: 36, display: 'grid', gap: 16 }}>
            <Badge icon={Camera} label="Barcode-triggered packing video capture" />
            <Badge icon={FolderCog} label="Drive, S3, or local storage — switch anytime, no code" />
            <Badge icon={ShieldCheck} label="Return-claim proof, organized per marketplace" />
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)' }}>
          © {new Date().getFullYear()} VMS Operations
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '56px',
        }}
      >
        <div className="card" style={{ width: '100%', maxWidth: 460, padding: '42px 40px', borderRadius: 24 }}>
          <h2 style={{ fontSize: 28, marginBottom: 8, color: 'var(--slate-900)' }}>Sign in</h2>
          <p style={{ marginBottom: 32, color: 'var(--slate-500)', fontSize: 14 }}>
            Access your packing, CCTV, and dashboard console.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
            <div>
              <label htmlFor="email" className="label" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12 }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="input"
                style={{ marginTop: 8 }}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12 }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="input"
                style={{ marginTop: 8 }}
                required
              />
            </div>

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: '#fef2f2', color: '#b91c1c', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px 0', fontSize: 15 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 26, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13 }}>
            No account yet? <span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>Create one</span>
          </div>

          <div style={{ marginTop: 24, padding: '16px 18px', borderRadius: 16, background: 'var(--slate-50)', border: '1px solid var(--border-hairline)', color: 'var(--slate-600)', fontSize: 13 }}>
            <p style={{ marginBottom: 6, fontWeight: 600, color: 'var(--slate-900)' }}>Demo credentials</p>
            <p style={{ marginBottom: 4 }}><span style={{ fontFamily: 'Courier New, monospace', color: 'var(--slate-900)' }}>master@vms.com</span></p>
            <p><span style={{ fontFamily: 'Courier New, monospace', color: 'var(--slate-900)' }}>123456</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
