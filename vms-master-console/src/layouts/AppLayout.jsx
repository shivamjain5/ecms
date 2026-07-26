import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Grid, Users, Box, Database, Rocket } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: Grid },
  { label: 'Clients', to: '/clients', icon: Users },
  { label: 'Go Live', to: '/go-live', icon: Rocket },
  { label: 'Platforms', to: '/platforms', icon: Box },
  { label: 'Storage', to: '/storage-config', icon: Database },
]

export default function AppLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('master_console_token')
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sidebar-branding-card">
          <div className="sidebar-avatar">V</div>
          <div>
            <p className="sidebar-brand">VMS Master Console</p>
            <p className="sidebar-subtitle">Admin portal</p>
          </div>
        </div>

        <div className="sidebar-section-header">Navigation</div>
        <nav className="sidebar-nav">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-icon"><Icon size={18} /></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="btn-ghost sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-header">
          <div className="page-hero">
            <p className="page-tag">Master Console</p>
            <h1 className="page-title">Enterprise control center</h1>
            <p className="page-subtitle">Manage clients, platforms, and storage backends from a single admin portal.</p>
          </div>
          <div className="header-flag">Admin portal</div>
        </div>

        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
