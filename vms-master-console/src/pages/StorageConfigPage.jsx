import { useEffect, useState } from 'react'
import { listStorageConfigs, createStorageConfig, updateStorageConfig, activateConfig, deactivateConfig, deleteConfig } from '../api/storageConfigs'
import { listActiveClients } from '../api/clients'
import { listPlatforms } from '../api/platforms'

const initialForm = {
  tenantId: '',
  platformId: '',
  providerType: 'AWS_S3',
  namingSource: 'ORDER_BARCODE',
  credentialsJson: '{"bucket":"vms-videos","region":"us-east-1"}',
  basePath: '/mnt/vms-storage',
}

function isLocalPathProvider(providerType) {
  return providerType === 'LOCAL_NAS' || providerType === 'LOCAL_DESKTOP'
}

function validateStorageForm(form, mode) {
  if (mode === 'create' && !form.tenantId) {
    return 'Client is required for new storage configuration.'
  }
  if (!form.providerType.trim()) {
    return 'Provider type is required.'
  }
  if (!form.namingSource.trim()) {
    return 'Naming source is required.'
  }
  if (isLocalPathProvider(form.providerType)) {
    if (!form.basePath.trim()) {
      return 'Local storage path is required.'
    }
    return ''
  }
  if (!form.credentialsJson.trim()) {
    return 'Credentials JSON is required.'
  }
  try {
    JSON.parse(form.credentialsJson)
  } catch (error) {
    return 'Credentials JSON must be valid JSON.'
  }
  return ''
}

function buildCredentialsJson(form) {
  if (isLocalPathProvider(form.providerType)) {
    return JSON.stringify({ basePath: form.basePath }, null, 2)
  }
  return form.credentialsJson
}

export default function StorageConfigPage() {
  const [configs, setConfigs] = useState([])
  const [tenants, setTenants] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [form, setForm] = useState(initialForm)
  const [editingConfig, setEditingConfig] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [configsRes, clientsRes, platformsRes] = await Promise.all([
        listStorageConfigs(),
        listActiveClients(),
        listPlatforms(),
      ])
      setConfigs(configsRes.data || [])
      setTenants(clientsRes.data || [])
      setPlatforms(platformsRes.data || [])
      setError('')
    } catch (err) {
      setError('Unable to load storage config data.')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = (configId, active) => {
    const action = active ? deactivateConfig : activateConfig
    action(configId)
      .then(() => setConfigs((current) => current.map((config) => (config.id === configId ? { ...config, active: !active } : config))))
      .catch(() => setError('Unable to change storage config status.'))
  }

  const startCreate = () => {
    setForm(initialForm)
    setFormMode('create')
    setEditingConfig(null)
    setError('')
    setStatusMessage('')
    setShowForm(true)
  }

  const startEdit = (config) => {
    const providerType = config.providerType || 'AWS_S3'
    let basePath = initialForm.basePath
    if (isLocalPathProvider(providerType)) {
      try {
        const creds = JSON.parse(config.credentialsJson || '{}')
        basePath = creds.basePath || initialForm.basePath
      } catch (error) {
        basePath = initialForm.basePath
      }
    }

    setForm({
      tenantId: config.tenant?.id ? String(config.tenant.id) : '',
      platformId: config.platform?.id ? String(config.platform.id) : '',
      providerType,
      namingSource: config.namingSource || 'ORDER_BARCODE',
      credentialsJson: config.credentialsJson || initialForm.credentialsJson,
      basePath,
    })
    setEditingConfig(config)
    setFormMode('edit')
    setError('')
    setStatusMessage('')
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setForm(initialForm)
    setEditingConfig(null)
    setFormMode('create')
    setError('')
    setStatusMessage('')
  }

  const handleChange = (field) => (event) => {
    const value = event.target.value
    if (field === 'providerType') {
      setForm({
        ...form,
        providerType: value,
        basePath: isLocalPathProvider(value) ? form.basePath || initialForm.basePath : form.basePath,
      })
      return
    }
    setForm({ ...form, [field]: value })
  }

  const handleSearch = (event) => {
    setSearchQuery(event.target.value)
  }

  const handleDelete = async (configId) => {
    const confirmed = window.confirm('Delete this storage configuration? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    setError('')
    setStatusMessage('')

    try {
      await deleteConfig(configId)
      setConfigs((current) => current.filter((config) => config.id !== configId))
      setStatusMessage('Storage configuration deleted successfully.')
    } catch (err) {
      setError('Unable to delete storage configuration.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    const validationError = validateStorageForm(form, formMode)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      if (formMode === 'edit' && editingConfig) {
        const response = await updateStorageConfig(editingConfig.id, {
          providerType: form.providerType,
          namingSource: form.namingSource,
          credentialsJson: buildCredentialsJson(form),
        })
        setConfigs((current) => current.map((config) => (config.id === editingConfig.id ? response.data : config)))
        setStatusMessage('Storage configuration updated successfully.')
      } else {
        const payload = {
          tenant: { id: Number(form.tenantId) },
          providerType: form.providerType,
          namingSource: form.namingSource,
          credentialsJson: buildCredentialsJson(form),
        }
        if (form.platformId) {
          payload.platform = { id: Number(form.platformId) }
        }
        const response = await createStorageConfig(payload)
        setConfigs((current) => [response.data, ...current])
        setStatusMessage('Storage configuration created successfully.')
      }
      cancelForm()
    } catch (err) {
      setError('Unable to save storage configuration. Please review the input and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <p className="panel-label">Storage</p>
          <h2 className="panel-title">Storage backends</h2>
          <p className="panel-description">Review storage connectors, add new configs, and update provider settings for clients.</p>
        </div>
        <button type="button" className="btn-primary" onClick={startCreate}>
          Add storage
        </button>
      </div>

      {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3 className="form-heading">{formMode === 'edit' ? 'Edit storage configuration' : 'Create storage configuration'}</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Client
              <select name="tenantId" value={form.tenantId} onChange={handleChange('tenantId')} className="select" required>
                <option value="">Select client</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.businessName || tenant.contactEmail}</option>
                ))}
              </select>
            </label>
            <label>
              Platform (optional)
              <select name="platformId" value={form.platformId} onChange={handleChange('platformId')} className="select">
                <option value="">Default storage</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>{platform.name || platform.displayName || platform.title}</option>
                ))}
              </select>
            </label>
            <label>
              Provider type
              <select name="providerType" value={form.providerType} onChange={handleChange('providerType')} className="select">
                <option value="AWS_S3">AWS S3</option>
                <option value="GOOGLE_DRIVE">Google Drive</option>
                <option value="LOCAL_NAS">Local NAS</option>
                <option value="LOCAL_DESKTOP">Desktop storage</option>
              </select>
            </label>
            <label>
              Naming source
              <select name="namingSource" value={form.namingSource} onChange={handleChange('namingSource')} className="select">
                <option value="ORDER_BARCODE">Order barcode</option>
                <option value="ORDER_ID">Order ID</option>
                <option value="TIMESTAMP_RANDOM">Timestamp / random</option>
              </select>
            </label>
            {isLocalPathProvider(form.providerType) ? (
              <label style={{ gridColumn: 'span 2' }}>
                Local storage path
                <input
                  name="basePath"
                  type="text"
                  value={form.basePath}
                  onChange={handleChange('basePath')}
                  className="input"
                  placeholder={form.providerType === 'LOCAL_DESKTOP' ? 'e.g. C:\\Users\\You\\Desktop\\vms-videos' : '/mnt/vms-storage/videos'}
                  required
                />
                <small className="field-note">
                  {form.providerType === 'LOCAL_DESKTOP'
                    ? 'Use a desktop folder path when running the app locally, for example C:\\Users\\You\\Desktop\\vms-videos.'
                    : 'Use the full network or mounted NAS path where videos should be stored.'}
                </small>
              </label>
            ) : (
              <label style={{ gridColumn: 'span 2' }}>
                Credentials JSON
                <textarea
                  name="credentialsJson"
                  rows="4"
                  value={form.credentialsJson}
                  onChange={handleChange('credentialsJson')}
                  className="input"
                  required
                />
              </label>
            )}
            <div className="form-actions" style={{ gridColumn: 'span 2' }}>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save config'}
              </button>
              <button type="button" className="btn-outline" onClick={cancelForm} disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h3>Storage configurations</h3>
            <p>{configs.length} entries found</p>
          </div>
          <div className="table-card-actions">
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search storage configs"
              className="input search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="table-empty">Loading configurations...</div>
        ) : configs.length === 0 ? (
          <div className="table-empty">No storage configurations found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Storage type</th>
                <th>Platform</th>
                <th>Credentials</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs
              .filter((config) => {
                const normalized = searchQuery.trim().toLowerCase()
                if (!normalized) {
                  return true
                }

                return [
                  config.tenant?.businessName,
                  config.providerType,
                  config.platform?.name,
                  config.platform?.displayName,
                  config.namingSource,
                  config.active ? 'active' : 'inactive',
                ]
                  .filter(Boolean)
                  .some((value) => value.toLowerCase().includes(normalized))
              })
              .map((config) => (
                <tr key={config.id}>
                  <td>{config.tenant?.businessName || 'Unknown'}</td>
                  <td>{config.providerType || 'N/A'}</td>
                  <td>{config.platform?.name || config.platform?.displayName || 'Default'}</td>
                  <td>{config.credentialsJson ? config.credentialsJson.slice(0, 48) + (config.credentialsJson.length > 48 ? '…' : '') : '—'}</td>
                  <td>{config.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => updateStatus(config.id, config.active)}>
                      {config.active ? 'Disable' : 'Enable'}
                    </button>
                    <button type="button" className="btn-sm" onClick={() => startEdit(config)}>
                      Edit
                    </button>
                    <button type="button" className="btn-sm btn-danger" onClick={() => handleDelete(config.id)}>
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
