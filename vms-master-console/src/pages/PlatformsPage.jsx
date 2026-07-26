import { useEffect, useState } from 'react'
import { listPlatforms, activatePlatform, deactivatePlatform, deletePlatform } from '../api/platforms'

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    listPlatforms()
      .then((response) => {
        setPlatforms(response.data || [])
        setError('')
      })
      .catch(() => setError('Unable to load platforms.'))
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = (platformId, active) => {
    const action = active ? deactivatePlatform : activatePlatform
    action(platformId)
      .then(() => setPlatforms((current) => current.map((platform) => (platform.id === platformId ? { ...platform, active: !active } : platform))))
      .catch(() => setError('Unable to update platform status.'))
  }

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <p className="panel-label">Platforms</p>
          <h2 className="panel-title">E-commerce platforms</h2>
          <p className="panel-description">Manage available platform integrations, enable or disable channels, and review platform type.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-card">
        <div className="table-card-header">
          <h3>Platform catalog</h3>
          <p>{platforms.length} platforms found</p>
        </div>

        {loading ? (
          <div className="table-empty">Loading platforms...</div>
        ) : platforms.length === 0 ? (
          <div className="table-empty">No platforms available.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((platform) => (
                <tr key={platform.id}>
                  <td>{platform.name || platform.title || 'Unknown platform'}</td>
                  <td>{platform.type || 'N/A'}</td>
                  <td>{platform.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => updateStatus(platform.id, platform.active)}>
                      {platform.active ? 'Disable' : 'Enable'}
                    </button>
                    <button type="button" className="btn-sm btn-danger" onClick={() => deletePlatform(platform.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
