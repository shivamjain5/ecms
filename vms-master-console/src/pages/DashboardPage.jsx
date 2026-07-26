import { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, Video, Settings, TrendingUp, AlertCircle, LogOut, ShieldCheck, ArrowUpRight } from 'lucide-react'
import * as clientsApi from '../api/clients'
import * as platformsApi from '../api/platforms'
import * as storageApi from '../api/storageConfigs'
import SampleIllustration from '../assets/sample-dashboard-illustration.svg'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalPlatforms: 0,
    totalConfigs: 0,
  })
  const [clients, setClients] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleLogout = () => {
    localStorage.removeItem('master_console_token')
    navigate('/login', { replace: true })
  }

  const navItems = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Clients', to: '/clients' },
    { label: 'Platforms', to: '/platforms' },
    { label: 'Storage', to: '/storage-config' },
  ]

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [clientsRes, platformsRes, configsRes] = await Promise.all([
        clientsApi.listClients(),
        platformsApi.listPlatforms(),
        storageApi.listStorageConfigs(),
      ])

      const clientsData = clientsRes.data || []
      const platformsData = platformsRes.data || []
      const configsData = configsRes.data || []

      setStats({
        totalClients: clientsData.length,
        activeClients: clientsData.filter(c => c.active).length,
        totalPlatforms: platformsData.length,
        totalConfigs: configsData.length,
      })

      setClients(clientsData.slice(0, 10)) // Show top 10 clients

      // Generate activity feed from clients
      const recentActivity = clientsData
        .map(client => ({
          id: client.id,
          type: 'client',
          message: `${client.businessName} added`,
          timestamp: client.createdAt,
          status: client.active ? 'active' : 'inactive',
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8)

      setActivity(recentActivity)
      setError(null)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-shell p-8">
      <div className="dashboard-topbar">
        <div>
          <span className="dashboard-badge">Master Console</span>
          <h1>Admin dashboard</h1>
          <p>
            Monitor seller activity, platform inventory, and storage configuration across the enterprise.
          </p>
        </div>

        <div className="dashboard-actions">
          <button type="button" className="btn-outline inline-flex items-center gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <button type="button" className="btn-primary inline-flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" />
            Launch reports
          </button>
        </div>
      </div>

      <div className="dashboard-hero-grid">
        <div className="dashboard-hero-copy">
          <div className="hero-pill">Business intelligence</div>
          <h2 className="hero-title">Live metrics with the right context.</h2>
          <p className="hero-body">
            See client onboarding, storage activity, and platform status at a glance so you can make faster operational decisions.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary">Review clients</button>
            <button type="button" className="btn-outline">View storage</button>
          </div>
        </div>

        <div className="dashboard-hero-image-card">
          <img src={SampleIllustration} alt="Dashboard illustration" className="dashboard-illustration" />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="dashboard-grid-sidebar mb-8">
        <div>
          {/* Stats Cards */}
          <div className="dashboard-grid mb-8">
            <StatCard
              title="Total Clients"
              value={stats.totalClients}
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Active Clients"
              value={stats.activeClients}
              icon={<TrendingUp className="w-6 h-6" />}
              color="green"
            />
            <StatCard
              title="Platforms"
              value={stats.totalPlatforms}
              icon={<Video className="w-6 h-6" />}
              color="amber"
            />
            <StatCard
              title="Storage Configs"
              value={stats.totalConfigs}
              icon={<Settings className="w-6 h-6" />}
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="dashboard-layout mb-8">
            <div className="dashboard-card dashboard-graph-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 22 }}>
                <div>
                  <p className="stat-label">Client status</p>
                  <h3>Active vs inactive clients</h3>
                </div>
                <span className="badge-pill">Live</span>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[
                  { name: 'Active', value: stats.activeClients },
                  { name: 'Inactive', value: stats.totalClients - stats.activeClients },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="dashboard-card dashboard-activity-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 22 }}>
                <div>
                  <p className="stat-label">Growth Trend</p>
                  <h3>Client growth this quarter</h3>
                </div>
                <span className="badge-pill">Forecast</span>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={[
                  { month: 'Jan', clients: 2 },
                  { month: 'Feb', clients: 4 },
                  { month: 'Mar', clients: 6 },
                  { month: 'Apr', clients: Math.max(8, stats.totalClients) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="clients" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <aside className="dashboard-sidebar">
          <div className="sidebar-nav">
            <div className="sidebar-logo">
              <div className="sidebar-avatar">V</div>
              <div>
                <p style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--slate-500)' }}>VMS</p>
                <p style={{ fontSize: 16, fontWeight: 700 }}>Master Console</p>
              </div>
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="dashboard-welcome-card">
            <h2>Welcome back, admin</h2>
            <p>
              The master console is ready. Use this space to review tenant activity, manage configurations, and stay on top of your e-commerce operations.
            </p>
            <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
              <div className="badge-pill">24/7 Monitoring</div>
              <div className="badge-pill">Quick access</div>
            </div>
          </div>

          <div className="dashboard-aside-card">
            <div className="aside-row">
              <div>
                <h3>System health</h3>
                <p className="aside-text">All systems nominal, no alerts detected.</p>
              </div>
              <span className="aside-badge">Stable</span>
            </div>
            <div className="aside-row">
              <div>
                <p className="aside-text">Pending reviews</p>
                <p className="aside-metric">8</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="dashboard-aside-card">
            <div className="aside-row">
              <div>
                <h3>Active pipelines</h3>
                <p className="aside-text">Workflows running across storage and capture systems.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="aside-badge">S3</span>
              <span className="aside-badge">Google Drive</span>
              <span className="aside-badge">Local</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Clients Table */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Clients Overview</h2>
          <a href="/clients" className="btn-primary px-4 py-2 text-sm">
            View All Clients
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Business Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? (
                clients.map(client => (
                  <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-gray-900 font-medium">{client.businessName}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{client.contactEmail}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        client.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 px-4 text-center text-gray-500">
                    No clients found. <a href="/clients" className="text-blue-600 hover:underline">Create one</a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {activity.length > 0 ? (
            activity.map(item => (
              <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{item.message}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  item.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  }

  return (
    <div className={`card border ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="opacity-20">{icon}</div>
      </div>
    </div>
  )
}
