import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RoleRoute from './components/RoleRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ScanningPage from './pages/ScanningPage'

/**
 * CLIENT PORTAL - Simplified for individual sellers/clients only.
 * 
 * This app is meant for:
 * - Packing staff to scan and upload videos
 * - Sellers to view their dashboard
 * - Read-only viewers to see dashboard
 * 
 * Configuration (platforms, storage, etc.) is done in the Master Console by admins.
 * No configuration UI here.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<RoleRoute path="/dashboard"><DashboardPage /></RoleRoute>} />
          <Route path="/scan" element={<RoleRoute path="/scan"><ScanningPage /></RoleRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
