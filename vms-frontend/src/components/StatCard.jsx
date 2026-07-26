import { motion } from 'framer-motion'

export default function StatCard({ label, value, icon: Icon, accent = 'var(--ink-900)', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="card"
      style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `${accent}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={accent} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink-900)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--slate-600)', marginTop: 4 }}>{label}</div>
      </div>
    </motion.div>
  )
}
