import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import AppLayout from './layouts/AppLayout'
import ClientsPage from './pages/ClientsPage'
import PlatformsPage from './pages/PlatformsPage'
import StorageConfigPage from './pages/StorageConfigPage'
import GoLivePage from './pages/GoLivePage'

function RequireAuth() {
  const location = useLocation()
  const token = localStorage.getItem('master_console_token')

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

/**
 * MASTER CONSOLE - Admin portal for managing multiple clients/sellers and all configurations.
 * 
 * This is the administrative dashboard where you:
 * - Create and manage seller/client accounts
 * - Configure e-commerce platforms available across all clients
 * - Configure storage backends (S3, Google Drive, Local) for each client
 * - View activity across all clients
 * - Activate/deactivate clients
 * 
 * This is a completely separate application from the Client Portal.
 * Authentication and authorization here is admin-only.
 */

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="go-live" element={<GoLivePage />} />
            <Route path="platforms" element={<PlatformsPage />} />
            <Route path="storage-config" element={<StorageConfigPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
