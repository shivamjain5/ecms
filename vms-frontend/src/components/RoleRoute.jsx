import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccess, defaultRouteForRole } from '../config/roleAccess'

export default function RoleRoute({ path, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-600)' }}>
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!canAccess(user.role, path)) {
    // Signed in, but this role doesn't have this screen -- send them to their own default page.
    return <Navigate to={defaultRouteForRole(user.role)} replace />
  }

  return children
}
