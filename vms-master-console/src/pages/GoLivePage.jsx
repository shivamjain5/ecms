import { useEffect, useState } from 'react'
import { listInactiveClients, goLiveClient, sendEmailOtp, verifyEmailOtp } from '../api/clients'

const initialForm = {
  clientId: '',
  schemaName: '',
  emailOtp: '',
}

export default function GoLivePage() {
  const [clients, setClients] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    setError('')
    setStatus('')
    try {
      const response = await listInactiveClients()
      setClients(response.data || [])
    } catch (err) {
      setError('Unable to load inactive clients. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value })
  }

  const handleClientChange = (event) => {
    setForm({ ...form, clientId: event.target.value, emailOtp: '' })
    setEmailOtpSent(false)
    setEmailVerified(false)
    setError('')
    setStatus('')
  }

  const sendEmailOtpHandler = async () => {
    if (!form.clientId) {
      setError('Select a client before sending email OTP.')
      return
    }
    setError('')
    setStatus('')
    try {
      await sendEmailOtp(form.clientId)
      setEmailOtpSent(true)
      setEmailVerified(false)
      setStatus('Email OTP has been sent. Enter it below to verify.')
    } catch (err) {
      const message = err?.response?.data || 'Unable to send email OTP.'
      setError(typeof message === 'string' ? message : 'Unable to send email OTP.')
    }
  }

  const verifyEmailOtpHandler = async () => {
    if (!form.clientId) {
      setError('Select a client before verifying email OTP.')
      return
    }
    if (!form.emailOtp.trim()) {
      setError('Enter the email OTP to verify.')
      return
    }
    setError('')
    setStatus('')
    try {
      await verifyEmailOtp(form.clientId, { otp: form.emailOtp.trim() })
      setEmailVerified(true)
      setStatus('Email verified successfully. You may now run provisioning.')
    } catch (err) {
      const message = err?.response?.data || 'Unable to verify email OTP.'
      setError(typeof message === 'string' ? message : 'Unable to verify email OTP.')
    }
  }


  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')

    if (!form.clientId) {
      setError('Please select a client to go live.')
      return
    }
    if (!form.schemaName.trim()) {
      setError('Schema name is required.')
      return
    }
    if (!emailVerified) {
      setError('Please verify email before running the script.')
      return
    }

    setRunning(true)
    try {
      const response = await goLiveClient(form.clientId, { schemaName: form.schemaName.trim() })
      setStatus(`Client is now live. Schema created: ${response.data?.schema || form.schemaName.trim()}`)
      setForm(initialForm)
      setEmailOtpSent(false)
      setEmailVerified(false)
      await loadClients()
    } catch (err) {
      const message = err?.response?.data || 'Unable to run go-live script. Please try again.'
      setError(typeof message === 'string' ? message : 'Unable to run go-live script. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="page-panel">
      <div className="page-panel-header">
        <div>
          <p className="panel-label">Go Live</p>
          <h2 className="panel-title">Provision client database schema</h2>
          <p className="panel-description">Select an inactive client, enter the schema name, and run the provisioning script with one click.</p>
          <div style={{ marginTop: 8 }}>
            <button
              id="send-email-otp-header"
              type="button"
              className="btn-primary"
              onClick={sendEmailOtpHandler}
              disabled={running}
              style={{ whiteSpace: 'nowrap' }}
            >
              Send Email OTP
            </button>
          </div>
        </div>
      </div>

      {status && <div className="alert alert-success">{status}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-card">
        <h3 className="form-heading">Client go-live setup</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Select client
            <select name="clientId" value={form.clientId} onChange={handleClientChange} className="select" required>
              <option value="">Select inactive client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.businessName || client.contactEmail}</option>
              ))}
            </select>
          </label>
          <label>
            Schema name
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                name="schemaName"
                type="text"
                value={form.schemaName}
                onChange={handleChange('schemaName')}
                className="input"
                placeholder="example: client_123_schema"
                required
              />
              <button
                type="button"
                className="btn-outline"
                onClick={sendEmailOtpHandler}
                disabled={!form.clientId || running}
                style={{ whiteSpace: 'nowrap' }}
              >
                Send Email OTP
              </button>
            </div>
            <small className="field-note">A new schema will be created in the existing database for this client.</small>
          </label>
          <div className="otp-grid" style={{ gridColumn: 'span 2' }}>
            <div className="otp-card">
              <h4>Email verification</h4>
              <button type="button" className="btn-outline" onClick={sendEmailOtpHandler} disabled={!form.clientId || running}>
                {emailOtpSent ? 'Resend Email OTP' : 'Send Email OTP'}
              </button>
              <input
                type="text"
                name="emailOtp"
                value={form.emailOtp}
                onChange={handleChange('emailOtp')}
                className="input"
                placeholder="Enter email OTP"
                disabled={!emailOtpSent || emailVerified}
              />
              <button type="button" className="btn-primary" onClick={verifyEmailOtpHandler} disabled={!emailOtpSent || emailVerified || running}>
                {emailVerified ? 'Email Verified' : 'Verify Email OTP'}
              </button>
            </div>
          </div>
          <div className="form-actions" style={{ gridColumn: 'span 2' }}>
            <button type="submit" className="btn-primary" disabled={running || loading || !emailVerified}>
              {running ? 'Running provisioning...' : 'Run provisioning script'}
            </button>
            <button type="button" className="btn-outline" onClick={loadClients} disabled={running}>
              Refresh clients
            </button>
          </div>
        </form>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h3>Inactive clients</h3>
            <p>{clients.length} clients available</p>
          </div>
        </div>
        {loading ? (
          <div className="table-empty">Loading inactive clients...</div>
        ) : clients.length === 0 ? (
          <div className="table-empty">No inactive clients found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.businessName || client.contactEmail}</td>
                  <td>{client.contactEmail || '—'}</td>
                  <td>{client.contactPhone || '—'}</td>
                  <td>{client.subscriptionTier || 'BASIC'}</td>
                  <td>{client.active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {running && (
        <div className="run-banner">
          <div className="run-spinner" />
          <span>Provisioning schema and initializing client...</span>
        </div>
      )}
    </div>
  )
}
