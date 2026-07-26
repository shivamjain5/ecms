/**
 * CLIENT PORTAL - Role-based access control.
 * 
 * This is a simplified customer portal - configuration is done in Master Console.
 * Packing staff can scan, sellers can view dashboard, viewers are read-only.
 */

export const ROLE_ACCESS = {
  ADMIN: ['/dashboard', '/scan'],           // Admin from this seller can also scan
  PACKING_STAFF: ['/scan'],                 // Packing staff scan only
  SELLER_OWNER: ['/dashboard'],             // Owner views dashboard
  VIEWER: ['/dashboard'],                   // Viewer sees dashboard (read-only)
}

export function canAccess(role, path) {
  if (!role) return false
  const allowed = ROLE_ACCESS[role] || []
  return allowed.includes(path)
}

// Where to land right after login, per role.
export function defaultRouteForRole(role) {
  const allowed = ROLE_ACCESS[role] || []
  return allowed[0] || '/dashboard'
}


