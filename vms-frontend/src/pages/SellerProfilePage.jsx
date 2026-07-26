import { useEffect, useState } from 'react'
import { Building2, Mail, Phone, Save, Loader, AlertCircle, CheckCircle } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/AuthContext'
import * as sellersApi from '../api/sellers'

export default function SellerProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [businessName, setBusinessName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const isEditable = user?.role === 'SELLER_OWNER'

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await sellersApi.getMyProfile()
        setProfile(data)
        setBusinessName(data.businessName)
        setContactPhone(data.contactPhone || '')
      } catch (err) {
        setErrorMsg('Could not load seller profile. Is the backend running?')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    if (!businessName.trim()) {
      setErrorMsg('Business name is required')
      return
    }

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const updated = await sellersApi.updateMyProfile({
        businessName: businessName.trim(),
        contactPhone: contactPhone.trim(),
      })
      setProfile(updated)
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setErrorMsg('Could not update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Seller Profile" subtitle="Manage your business information">
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>
          Loading…
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout title="Seller Profile" subtitle="Manage your business information">
        <div style={{ background: 'var(--red-100)', color: 'var(--red-500)', padding: '16px', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Seller Profile" subtitle="Manage your business information">
      <div style={{ maxWidth: 600 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'var(--amber-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={28} color="var(--amber-600)" strokeWidth={1.6} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Business Profile</h2>
              <p style={{ fontSize: 13.5, color: 'var(--slate-600)' }}>
                Your seller account and business details
              </p>
            </div>
          </div>

          {successMsg && (
            <div style={{ background: 'var(--green-100)', color: 'var(--green-700)', padding: '12px 16px', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, fontSize: 13.5 }}>
              <CheckCircle size={16} />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{ background: 'var(--red-100)', color: 'var(--red-500)', padding: '12px 16px', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, fontSize: 13.5 }}>
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Seller ID (read-only) */}
            <div>
              <label className="label">Seller ID</label>
              <input
                className="input"
                type="text"
                value={profile.id}
                disabled
                style={{ background: 'var(--slate-50)', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: 11.5, color: 'var(--slate-500)', marginTop: 6 }}>
                Unique identifier — cannot be changed
              </p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} /> Contact Email
              </label>
              <input
                className="input"
                type="email"
                value={profile.contactEmail}
                disabled
                style={{ background: 'var(--slate-50)', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: 11.5, color: 'var(--slate-500)', marginTop: 6 }}>
                Unique identifier — contact support to change
              </p>
            </div>

            {/* Business Name (editable) */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={14} /> Business Name
              </label>
              <input
                className="input"
                type="text"
                placeholder="Your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={!isEditable}
                style={{
                  background: !isEditable ? 'var(--slate-50)' : 'white',
                  cursor: !isEditable ? 'not-allowed' : 'text',
                }}
              />
            </div>

            {/* Contact Phone (editable) */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} /> Contact Phone
              </label>
              <input
                className="input"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={!isEditable}
                style={{
                  background: !isEditable ? 'var(--slate-50)' : 'white',
                  cursor: !isEditable ? 'not-allowed' : 'text',
                }}
              />
            </div>

            {/* Account Status */}
            <div>
              <label className="label">Account Status</label>
              <div style={{
                padding: '12px 14px',
                background: profile.active ? 'var(--green-50)' : 'var(--red-50)',
                border: `1px solid ${profile.active ? 'var(--green-200)' : 'var(--red-200)'}`,
                borderRadius: 8,
                color: profile.active ? 'var(--green-700)' : 'var(--red-700)',
                fontSize: 13.5,
                fontWeight: 500,
              }}>
                {profile.active ? '✓ Active' : '✗ Inactive'}
              </div>
            </div>

            {/* Created At */}
            <div>
              <label className="label">Member Since</label>
              <input
                className="input"
                type="text"
                value={new Date(profile.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                disabled
                style={{ background: 'var(--slate-50)', cursor: 'not-allowed' }}
              />
            </div>

            {isEditable && (
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 8,
                  background: 'var(--amber-500)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <>
                    <Loader size={16} className="spinner" /> Saving…
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            )}

            {!isEditable && (
              <div style={{ background: '#FDF2E3', color: 'var(--amber-600)', padding: '12px 16px', borderRadius: 8, fontSize: 13.5, marginTop: 8 }}>
                You're viewing in read-only mode. Only Seller Owners can edit this profile.
              </div>
            )}
          </form>
        </div>
      </div>

      <style jsx>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  )
}
