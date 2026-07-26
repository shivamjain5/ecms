import { LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ title, subtitle }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = (user?.fullName || user?.email || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        borderBottom: '1px solid var(--border-hairline)',
        background: 'var(--paper-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 5,
      }}
    >
      <div>
        <h2 style={{ fontSize: 18 }}>{title}</h2>
        {subtitle && <div style={{ fontSize: 12.5, color: 'var(--slate-600)', marginTop: 2 }}>{subtitle}</div>}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            padding: '6px 8px',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--ink-900)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {initials}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.fullName || user?.email}</div>
            <div style={{ fontSize: 11, color: 'var(--slate-600)' }}>{user?.role}</div>
          </div>
          <ChevronDown size={15} color="var(--slate-600)" />
        </button>

        {menuOpen && (
          <div
            className="card"
            style={{
              position: 'absolute',
              right: 0,
              top: '110%',
              width: 180,
              padding: 6,
            }}
          >
            <button
              onClick={handleLogout}
              className="btn-outline"
              style={{
                width: '100%',
                border: 'none',
                justifyContent: 'flex-start',
                color: 'var(--red-500)',
                fontWeight: 600,
                padding: '9px 10px',
              }}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
