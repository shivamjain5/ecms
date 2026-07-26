import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Store, HardDrive, Plus, Trash2, Ban, Check, ShieldAlert } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/AuthContext'
import * as platformsApi from '../api/platforms'
import * as storageApi from '../api/storageConfigs'

const TABS = [
  { id: 'platforms', label: 'Marketplaces', icon: Store },
  { id: 'storage', label: 'Storage & naming', icon: HardDrive },
]

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState('platforms')
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <AppLayout title="Configuration" subtitle="Manage marketplaces, storage destinations, and video naming rules">
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '1px solid var(--border-hairline)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 6px',
              marginBottom: -1,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === id ? '2px solid var(--amber-500)' : '2px solid transparent',
              color: activeTab === id ? 'var(--ink-900)' : 'var(--slate-600)',
              fontWeight: 600,
              fontSize: 14,
              marginRight: 18,
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {!isAdmin && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#FDF2E3', color: 'var(--amber-600)', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13.5 }}>
          <ShieldAlert size={16} /> You're viewing in read-only mode. Ask an admin to make changes here.
        </div>
      )}

      {activeTab === 'platforms' && <PlatformsTab isAdmin={isAdmin} />}
      {activeTab === 'storage' && <StorageTab isAdmin={isAdmin} />}
    </AppLayout>
  )
}

/* ---------------- Marketplaces tab ---------------- */

function PlatformsTab({ isAdmin }) {
  const [platforms, setPlatforms] = useState([])
  const [inactivePlatforms, setInactivePlatforms] = useState([])
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  function refresh() {
    setLoading(true)
    Promise.all([platformsApi.listActivePlatforms(), platformsApi.listInactivePlatforms()])
      .then(([active, inactive]) => {
        setPlatforms(active)
        setInactivePlatforms(inactive)
      })
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!code.trim() || !displayName.trim()) return
    setSaving(true)
    setErrorMsg('')
    try {
      await platformsApi.createPlatform({ code, displayName })
      setCode('')
      setDisplayName('')
      refresh()
    } catch (err) {
      setErrorMsg('Could not add marketplace. It may already exist.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id) {
    await platformsApi.deactivatePlatform(id)
    refresh()
  }

  async function handleActivate(id) {
    await platformsApi.activatePlatform(id)
    refresh()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Active marketplaces</h3>
        <p style={{ fontSize: 12.5, color: 'var(--slate-600)', marginBottom: 16 }}>
          Shown in the "which website?" dropdown on the Scan & Pack screen
        </p>

        {loading ? (
          <div style={{ color: 'var(--slate-400)', fontSize: 13 }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {platforms.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.displayName}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--slate-400)' }}>{p.code}</div>
                </div>
                {isAdmin && (
                  <button className="btn-outline" style={{ padding: '6px 10px', border: 'none' }} onClick={() => handleDeactivate(p.id)}>
                    <Ban size={14} color="var(--red-500)" />
                  </button>
                )}
              </motion.div>
            ))}
            {inactivePlatforms.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>Inactive marketplaces</div>
                <p style={{ fontSize: 12.5, color: 'var(--slate-600)', marginBottom: 12 }}>
                  Reactivate any marketplace that was disabled by mistake.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {inactivePlatforms.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 10,
                        background: 'var(--slate-50)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.displayName}</div>
                        <div className="mono" style={{ fontSize: 11.5, color: 'var(--slate-400)' }}>{p.code}</div>
                      </div>
                      <button
                        className="btn-outline"
                        style={{ padding: '6px 10px 6px 12px', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => handleActivate(p.id)}
                      >
                        <Check size={14} color="var(--green-600)" />
                        Reactivate
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="card" style={{ padding: 24, height: 'fit-content' }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Add a marketplace</h3>
          <p style={{ fontSize: 12.5, color: 'var(--slate-600)', marginBottom: 16 }}>
            No code change needed — new sites appear immediately for all staff
          </p>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: 12 }}>
              <label className="label">Code</label>
              <input className="input mono" placeholder="JIOMART" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Display name</label>
              <input className="input" placeholder="JioMart" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            {errorMsg && <div style={{ color: 'var(--red-500)', fontSize: 12.5, marginBottom: 12 }}>{errorMsg}</div>}
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
              <Plus size={15} /> {saving ? 'Adding…' : 'Add marketplace'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

/* ---------------- Storage & naming tab ---------------- */

const PROVIDER_TEMPLATES = {
  GOOGLE_DRIVE: '{\n  "folderId": "",\n  "clientId": "",\n  "clientSecret": "",\n  "refreshToken": ""\n}',
  S3: '{\n  "bucket": "",\n  "region": "",\n  "accessKey": "",\n  "secretKey": ""\n}',
  LOCAL: '{\n  "basePath": "/mnt/vms-storage"\n}',
}

function StorageTab({ isAdmin }) {
  const { user } = useAuth()
  const [sellerId, setSellerId] = useState(user?.sellerId || '')
  const [configs, setConfigs] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(false)

  const [platformId, setPlatformId] = useState('')
  const [providerType, setProviderType] = useState('LOCAL')
  const [credentialsJson, setCredentialsJson] = useState(PROVIDER_TEMPLATES.LOCAL)
  const [videoNamingSource, setVideoNamingSource] = useState('ORDER_NUMBER')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    platformsApi.listActivePlatforms().then(setPlatforms).catch(() => {})
  }, [])

  function loadConfigs() {
    if (!sellerId) return
    setLoading(true)
    setAccessDenied(false)
    storageApi
      .listStorageConfigs(sellerId)
      .then(setConfigs)
      .catch((err) => {
        if (err.response?.status === 403) {
          setAccessDenied(true)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (sellerId) loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    try {
      await storageApi.saveStorageConfig({
        seller: { id: Number(sellerId) },
        platform: platformId ? { id: Number(platformId) } : null,
        providerType,
        credentialsJson,
        videoNamingSource,
        active: true,
      })
      loadConfigs()
    } catch (err) {
      setErrorMsg('Could not save this storage config. Check the JSON is valid and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await storageApi.deleteStorageConfig(id)
    loadConfigs()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 20 }}>
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Configured destinations</h3>
        <p style={{ fontSize: 12.5, color: 'var(--slate-600)', marginBottom: 16 }}>
          One row per seller, or per seller + marketplace
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="input" placeholder="Seller ID" value={sellerId} onChange={(e) => setSellerId(e.target.value)} />
          <button className="btn btn-outline" onClick={loadConfigs}>Load</button>
        </div>

        {loading && <div style={{ color: 'var(--slate-400)', fontSize: 13 }}>Loading…</div>}

        {accessDenied && (
          <div style={{ background: 'var(--red-100)', color: 'var(--red-500)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
            Storage settings are visible to Admins only. Ask an admin to check this for you.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {configs.map((c) => (
            <div key={c.id} style={{ border: '1px solid var(--border-hairline)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-done">{c.providerType}</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>
                    {c.platform ? c.platform.displayName : 'All marketplaces (default)'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--slate-600)', marginTop: 2 }}>
                    Filenames use: <strong>{c.videoNamingSource === 'AWB_NUMBER' ? 'AWB number' : 'Order number'}</strong>
                  </div>
                </div>
                {isAdmin && (
                  <button className="btn-outline" style={{ padding: '6px 10px', border: 'none' }} onClick={() => handleDelete(c.id)}>
                    <Trash2 size={14} color="var(--red-500)" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!loading && !accessDenied && configs.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>No storage config loaded yet for this seller.</div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="card" style={{ padding: 24, height: 'fit-content' }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Add / update destination</h3>
          <p style={{ fontSize: 12.5, color: 'var(--slate-600)', marginBottom: 16 }}>
            Switch a seller between Drive, S3, or Local — no redeploy needed
          </p>
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 12 }}>
              <label className="label">Marketplace (leave blank = applies to all)</label>
              <select className="select" value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
                <option value="">All marketplaces (default)</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>{p.displayName}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="label">Storage provider</label>
              <select
                className="select"
                value={providerType}
                onChange={(e) => {
                  setProviderType(e.target.value)
                  setCredentialsJson(PROVIDER_TEMPLATES[e.target.value])
                }}
              >
                <option value="LOCAL">Local / NAS</option>
                <option value="S3">AWS S3</option>
                <option value="GOOGLE_DRIVE">Google Drive</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="label">Video filename source</label>
              <select className="select" value={videoNamingSource} onChange={(e) => setVideoNamingSource(e.target.value)}>
                <option value="ORDER_NUMBER">Order number (default)</option>
                <option value="AWB_NUMBER">AWB number</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Credentials (JSON)</label>
              <textarea
                className="input mono"
                style={{ minHeight: 120, resize: 'vertical' }}
                value={credentialsJson}
                onChange={(e) => setCredentialsJson(e.target.value)}
              />
            </div>

            {errorMsg && <div style={{ color: 'var(--red-500)', fontSize: 12.5, marginBottom: 12 }}>{errorMsg}</div>}

            <button className="btn btn-primary" style={{ width: '100%' }} disabled={saving || !sellerId}>
              {saving ? 'Saving…' : 'Save destination'}
            </button>
            {!sellerId && <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: 8 }}>Enter a Seller ID on the left first.</div>}
          </form>
        </div>
      )}
    </div>
  )
}
