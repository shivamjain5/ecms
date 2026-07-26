import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanBarcode, Video, Square, UploadCloud, CheckCircle2, XCircle, PackageCheck } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import * as packingVideosApi from '../api/packingVideos'
import * as platformsApi from '../api/platforms'

const STAGES = {
  SCAN: 'scan',
  READY: 'ready',
  RECORDING: 'recording',
  UPLOADING: 'uploading',
  DONE: 'done',
}

export default function ScanningPage() {
  const [stage, setStage] = useState(STAGES.SCAN)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [order, setOrder] = useState(null)
  const [platforms, setPlatforms] = useState([])
  const [selectedPlatformId, setSelectedPlatformId] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [lastResult, setLastResult] = useState(null)

  const barcodeRef = useRef(null)
  const videoPreviewRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    platformsApi.listActivePlatforms().then(setPlatforms).catch(() => {})
    barcodeRef.current?.focus()
    return () => stopStream()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (timerRef.current) clearInterval(timerRef.current)
  }

  async function handleBarcodeSubmit(e) {
    e.preventDefault()
    if (!barcodeInput.trim()) return
    setErrorMsg('')
    try {
      const found = await packingVideosApi.lookupOrderByBarcode(barcodeInput.trim())
      setOrder(found)
      setSelectedPlatformId(found.platform?.id || '')
      setStage(STAGES.READY)
    } catch (err) {
      setErrorMsg(`No order found for barcode "${barcodeInput.trim()}". Check the scan and try again.`)
    }
  }

  async function startRecording() {
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.start()
      mediaRecorderRef.current = recorder

      setElapsedSeconds(0)
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
      setStage(STAGES.RECORDING)
    } catch (err) {
      setErrorMsg('Could not access the webcam. Check camera permissions for this site.')
    }
  }

  async function stopAndUpload() {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    setStage(STAGES.UPLOADING)

    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve
    })
    recorder.stop()
    await stopped
    stopStream()

    const blob = new Blob(chunksRef.current, { type: 'video/webm' })
    const file = new File([blob], `${order.orderBarcode}.webm`, { type: 'video/webm' })

    const MAX_UPLOAD_BYTES = 200 * 1024 * 1024 // matches backend's spring.servlet.multipart.max-file-size
    if (file.size > MAX_UPLOAD_BYTES) {
      setLastResult({ ok: false, message: 'This recording is over the 200MB upload limit. Try a shorter recording.' })
      setStage(STAGES.DONE)
      return
    }

    try {
      const result = await packingVideosApi.uploadPackingVideo({
        orderBarcode: order.orderBarcode,
        file,
        durationSeconds: elapsedSeconds,
        platformId: selectedPlatformId || undefined,
      })
      setLastResult({ ok: true, video: result })
      setStage(STAGES.DONE)
    } catch (err) {
      setLastResult({ ok: false })
      setStage(STAGES.DONE)
    }
  }

  function resetForNextOrder() {
    setStage(STAGES.SCAN)
    setBarcodeInput('')
    setOrder(null)
    setSelectedPlatformId('')
    setElapsedSeconds(0)
    setLastResult(null)
    setErrorMsg('')
    setTimeout(() => barcodeRef.current?.focus(), 50)
  }

  return (
    <AppLayout title="Scan & Pack" subtitle="Scan an order, select the marketplace, and record proof of packing">
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {stage === STAGES.SCAN && (
            <motion.div key="scan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--teal-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <ScanBarcode size={28} color="var(--teal-500)" />
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Scan the order barcode</h3>
              <p style={{ fontSize: 13.5, color: 'var(--slate-600)', marginBottom: 24 }}>
                Point the scanner at the order label — the field below accepts scanner input automatically.
              </p>
              <form onSubmit={handleBarcodeSubmit}>
                <input
                  ref={barcodeRef}
                  className="input mono"
                  style={{ textAlign: 'center', fontSize: 16, padding: '14px 16px' }}
                  placeholder="Scan or type barcode…"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  autoFocus
                />
              </form>
              {errorMsg && (
                <div style={{ marginTop: 16, background: 'var(--red-100)', color: 'var(--red-500)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                  {errorMsg}
                </div>
              )}
            </motion.div>
          )}

          {stage === STAGES.READY && order && (
            <motion.div key="ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card" style={{ padding: 32 }}>
              <OrderSummary order={order} />

              <div style={{ margin: '20px 0' }}>
                <label className="label" htmlFor="platform">Which marketplace is this for?</label>
                <select
                  id="platform"
                  className="select"
                  value={selectedPlatformId}
                  onChange={(e) => setSelectedPlatformId(e.target.value)}
                >
                  <option value="">Select marketplace…</option>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>{p.displayName}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={startRecording} disabled={!selectedPlatformId}>
                <Video size={16} /> Start recording
              </button>
              <button className="btn btn-outline" style={{ width: '100%', marginTop: 10 }} onClick={resetForNextOrder}>
                Scan a different order
              </button>

              {errorMsg && (
                <div style={{ marginTop: 16, background: 'var(--red-100)', color: 'var(--red-500)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                  {errorMsg}
                </div>
              )}
            </motion.div>
          )}

          {stage === STAGES.RECORDING && (
            <motion.div key="recording" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card" style={{ padding: 28 }}>
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 20 }}>
                <video ref={videoPreviewRef} autoPlay muted playsInline style={{ width: '100%', display: 'block', aspectRatio: '16/10', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(20,33,61,0.75)', color: 'white', padding: '5px 11px', borderRadius: 999, fontSize: 12.5, fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red-500)', animation: 'pulse 1.2s infinite' }} />
                  REC {formatTime(elapsedSeconds)}
                </div>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--slate-600)', marginBottom: 16 }}>
                Packing order <span className="mono" style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{order.orderBarcode}</span> — finish packing, then stop to upload.
              </div>
              <button className="btn btn-primary" style={{ width: '100%', background: 'var(--red-500)', color: 'white' }} onClick={stopAndUpload}>
                <Square size={15} /> Stop & upload
              </button>
            </motion.div>
          )}

          {stage === STAGES.UPLOADING && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div className="scanline-wrap" style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--ink-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <div className="scanline-beam" />
                <UploadCloud size={26} color="var(--amber-500)" />
              </div>
              <h3 style={{ fontSize: 17, marginBottom: 6 }}>Saving your recording…</h3>
              <p style={{ fontSize: 13.5, color: 'var(--slate-600)' }}>
                The video is queued for background upload — you can start scanning the next order once this finishes.
              </p>
            </motion.div>
          )}

          {stage === STAGES.DONE && (
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card" style={{ padding: 40, textAlign: 'center' }}>
              {lastResult?.ok ? (
                <>
                  <div style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--teal-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle2 size={28} color="var(--teal-500)" />
                  </div>
                  <h3 style={{ fontSize: 18, marginBottom: 8 }}>Packing video saved</h3>
                  <p style={{ fontSize: 13.5, color: 'var(--slate-600)', marginBottom: 4 }}>
                    Order <span className="mono" style={{ fontWeight: 600 }}>{order.orderBarcode}</span> is queued for upload.
                  </p>
                  <span className="badge badge-pending" style={{ marginTop: 8 }}>Uploading in background</span>
                </>
              ) : (
                <>
                  <div style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--red-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <XCircle size={28} color="var(--red-500)" />
                  </div>
                  <h3 style={{ fontSize: 18, marginBottom: 8 }}>Couldn't save the recording</h3>
                  <p style={{ fontSize: 13.5, color: 'var(--slate-600)' }}>
                    {lastResult?.message || "Check your connection to the server and try recording again."}
                  </p>
                </>
              )}
              <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={resetForNextOrder}>
                <PackageCheck size={16} /> Scan next order
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </AppLayout>
  )
}

function OrderSummary({ order }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div className="label">Order found</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
        <Field label="Barcode" value={order.orderBarcode} mono />
        <Field label="Order number" value={order.orderNumber || '—'} mono />
        <Field label="AWB number" value={order.awbNumber || '—'} mono />
        <Field label="Customer" value={order.customerName || '—'} />
        <Field label="Product" value={order.productName || '—'} />
      </div>
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
      <div className={mono ? 'mono' : ''} style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
