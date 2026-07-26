import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ScanLine, PackageSearch } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_ACCESS } from '../config/roleAccess'

const ALL_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scan', label: 'Scan & Pack', icon: ScanLine },
]

export default function Sidebar() {
  const { user } = useAuth()
  const allowedPaths = ROLE_ACCESS[user?.role] || []
  const navItems = ALL_NAV_ITEMS.filter((item) => allowedPaths.includes(item.to))

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--ink-900)',
        color: 'white',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 28px' }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'var(--amber-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PackageSearch size={19} color="var(--ink-900)" strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>VMS</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', marginTop: 2 }}>
            CLIENT PORTAL
          </div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? 'var(--ink-900)' : 'rgba(255,255,255,0.78)',
              background: isActive ? 'var(--amber-500)' : 'transparent',
              transition: 'background 0.12s ease, color 0.12s ease',
            })}
          >
            <Icon size={17} strokeWidth={2.2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '12px', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
        v1.0.0 — Client Portal
      </div>
    </aside>
  )
}
