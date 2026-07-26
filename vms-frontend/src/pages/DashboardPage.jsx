import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Video, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import StatCard from '../components/StatCard'
import * as dashboardApi from '../api/dashboard'

const STATUS_COLORS = {
  DONE: '#0F8B8D',
  PENDING: '#F2A93B',
  UPLOADING: '#3654C4',
  FAILED: '#D64545',
}

export default function DashboardPage() {
  const [platformData, setPlatformData] = useState([])
  const [statusData, setStatusData] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [byPlatform, byStatus] = await Promise.all([
          dashboardApi.getVideosByPlatform(),
          dashboardApi.getUploadStatusBreakdown(),
        ])
        setPlatformData(Object.entries(byPlatform).map(([name, count]) => ({ name, count })))
        setStatusData(Object.entries(byStatus).map(([name, value]) => ({ name, value })))
      } catch (err) {
        setErrorMsg('Could not load dashboard data. Is the backend running?')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const total = statusData.reduce((sum, s) => sum + s.value, 0)
  const doneCount = statusData.find((s) => s.name === 'DONE')?.value || 0
  const pendingCount = statusData.find((s) => s.name === 'PENDING')?.value || 0
  const failedCount = statusData.find((s) => s.name === 'FAILED')?.value || 0

  return (
    <AppLayout title="Dashboard" subtitle="Packing video activity across all marketplaces">
      {errorMsg && (
        <div style={{ background: 'var(--red-100)', color: 'var(--red-500)', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13.5 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total videos" value={loading ? '—' : total} icon={Video} accent="#14213D" delay={0} />
        <StatCard label="Uploaded" value={loading ? '—' : doneCount} icon={CheckCircle2} accent="#0F8B8D" delay={0.05} />
        <StatCard label="Pending" value={loading ? '—' : pendingCount} icon={Clock} accent="#DB9527" delay={0.1} />
        <StatCard label="Failed" value={loading ? '—' : failedCount} icon={AlertTriangle} accent="#D64545" delay={0.15} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Videos by marketplace</h3>
          <p style={{ fontSize: 12.5, color: 'var(--slate-600)', marginBottom: 18 }}>
            Packing-proof volume per e-commerce platform
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={platformData} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--slate-600)' }} axisLine={{ stroke: 'var(--border-hairline)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--slate-600)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid var(--border-hairline)', fontSize: 13 }}
                cursor={{ fill: 'rgba(20,33,61,0.04)' }}
              />
              <Bar dataKey="count" fill="#F2A93B" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Upload status</h3>
          <p style={{ fontSize: 12.5, color: 'var(--slate-600)', marginBottom: 18 }}>
            Background storage-upload health
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#8B93A1'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border-hairline)', fontSize: 13 }} />
              <Legend
                verticalAlign="bottom"
                height={30}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: 12.5, color: 'var(--slate-600)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  )
}
