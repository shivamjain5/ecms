import { useEffect, useState } from 'react'
import { listClients, createClient, updateClient, activateClient, deactivateClient, deleteClient } from '../api/clients'

const initialForm = {
  businessName: '',
  contactEmail: '',
  contactPhone: '',
  brandName: '',
  gstinNumber: '',
  address: '',
  pincode: '',
  subscriptionTier: 'BASIC',
}

function validateClientForm(form) {
  if (!form.businessName.trim()) {
    return 'Business name is required.'
  }
  if (!form.contactEmail.trim()) {
    return 'Contact email is required.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
    return 'Contact email must be valid.'
  }
  return ''
}

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [form, setForm] = useState(initialForm)
  const [editingClient, setEditingClient] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = () => {
    setLoading(true)
    listClients()
      .then((response) => {
        setClients(response.data || [])
        setError('')
      })
      .catch(() => setError('Unable to load clients.'))
      .finally(() => setLoading(false))
  }

  const updateStatus = (clientId, active) => {
    const action = active ? deactivateClient : activateClient
    action(clientId)
      .then(() => setClients((current) => current.map((client) => (client.id === clientId ? { ...client, active: !active } : client))))
      .catch(() => setError('Unable to change client status.'))
  }

  const startCreate = () => {
    setForm(initialForm)
    setFormMode('create')
    setEditingClient(null)
    setError('')
    setStatusMessage('')
    setShowForm(true)
  }

  const startEdit = (client) => {
    setForm({
      businessName: client.businessName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      brandName: client.brandName || '',
      gstinNumber: client.gstinNumber || '',
      address: client.address || '',
      pincode: client.pincode || '',
      subscriptionTier: client.subscriptionTier || 'BASIC',
    })
    setEditingClient(client)
    setFormMode('edit')
    setError('')
    setStatusMessage('')
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setForm(initialForm)
    setEditingClient(null)
    setFormMode('create')
    setError('')
    setStatusMessage('')
  }

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value })
  }

  const handleSearch = (event) => {
    setSearchQuery(event.target.value)
  }

  const handleDelete = async (clientId) => {
    const confirmed = window.confirm('Delete this client? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    setError('')
    setStatusMessage('')

    try {
      await deleteClient(clientId)
      setClients((current) => current.filter((client) => client.id !== clientId))
      setStatusMessage('Client deleted successfully.')
    } catch (err) {
      setError('Unable to delete client.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    const validationError = validateClientForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)

    try {
      if (formMode === 'edit' && editingClient) {
        const response = await updateClient(editingClient.id, {
          businessName: form.businessName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          brandName: form.brandName,
          gstinNumber: form.gstinNumber,
          address: form.address,
          pincode: form.pincode,
          subscriptionTier: form.subscriptionTier,
        })
        setClients((current) => current.map((client) => (client.id === editingClient.id ? response.data : client)))
        setStatusMessage('Client updated successfully.')
      } else {
        const response = await createClient({
          businessName: form.businessName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          brandName: form.brandName,
          gstinNumber: form.gstinNumber,
          address: form.address,
          pincode: form.pincode,
          subscriptionTier: form.subscriptionTier,
        })
        setClients((current) => [response.data, ...current])
        setStatusMessage('Client created successfully.')
      }
      cancelForm()
    } catch (err) {
      setError('Unable to save client. Please review the fields and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <p className="panel-label">Clients</p>
          <h2 className="panel-title">Manage seller accounts</h2>
          <p className="panel-description">Review registered clients, activate or deactivate accounts, and keep client details up to date.</p>
        </div>
        <button type="button" className="btn-primary" onClick={startCreate}>
          Add client
        </button>
      </div>

      {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3 className="form-heading">{formMode === 'edit' ? 'Edit client' : 'Create new client'}</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Business name
              <input name="businessName" value={form.businessName} onChange={handleChange('businessName')} className="input" required />
            </label>
            <label>
              Contact email
              <input name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange('contactEmail')} className="input" required />
            </label>
            <label>
              Contact phone
              <input name="contactPhone" value={form.contactPhone} onChange={handleChange('contactPhone')} className="input" />
            </label>
            <label>
              Brand name
              <input name="brandName" value={form.brandName} onChange={handleChange('brandName')} className="input" />
            </label>
            <label>
              GSTIN number
              <input name="gstinNumber" value={form.gstinNumber} onChange={handleChange('gstinNumber')} className="input" />
            </label>
            <label style={{ gridColumn: 'span 2' }}>
              Address
              <textarea name="address" rows="3" value={form.address} onChange={handleChange('address')} className="input" />
            </label>
            <label>
              Pincode
              <input name="pincode" value={form.pincode} onChange={handleChange('pincode')} className="input" />
            </label>
            <label>
              Subscription tier
              <select name="subscriptionTier" value={form.subscriptionTier} onChange={handleChange('subscriptionTier')} className="select">
                <option value="BASIC">BASIC</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </label>
            <div className="form-actions" style={{ gridColumn: 'span 2' }}>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : formMode === 'edit' ? 'Save changes' : 'Create client'}
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
            <h3>Client list</h3>
            <p>{clients.length} clients found</p>
          </div>
          <div className="table-card-actions">
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search clients"
              className="input search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="table-empty">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="table-empty">No clients found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Brand</th>
                <th>GSTIN</th>
                <th>Pincode</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients
              .filter((client) => {
                const normalized = searchQuery.trim().toLowerCase()
                if (!normalized) {
                  return true
                }

                return [
                  client.businessName,
                  client.contactEmail,
                  client.contactPhone,
                  client.subscriptionTier,
                ]
                  .filter(Boolean)
                  .some((value) => value.toLowerCase().includes(normalized))
              })
              .map((client) => (
                <tr key={client.id}>
                  <td>{client.businessName || client.contactEmail}</td>
                  <td>{client.contactEmail || '—'}</td>
                  <td>{client.brandName || '—'}</td>
                  <td>{client.gstinNumber || '—'}</td>
                  <td>{client.pincode || '—'}</td>
                  <td>{client.subscriptionTier || 'BASIC'}</td>
                  <td>{client.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => updateStatus(client.id, client.active)}>
                      {client.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="btn-sm" onClick={() => startEdit(client)}>
                      Edit
                    </button>
                    <button type="button" className="btn-sm btn-danger" onClick={() => handleDelete(client.id)}>
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
