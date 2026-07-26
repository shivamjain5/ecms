import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function AppLayout({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-width)' }}>
        <Topbar title={title} subtitle={subtitle} />
        <main style={{ padding: '28px' }}>{children}</main>
      </div>
    </div>
  )
}
