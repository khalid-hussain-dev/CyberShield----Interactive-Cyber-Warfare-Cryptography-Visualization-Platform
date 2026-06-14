import BrandLoader from './BrandLoader'

const toneClasses = {
  red: 'border-cyber-red/40 bg-cyber-red/15 text-red-100 shadow-[0_0_64px_rgba(239,68,68,0.35)]',
  green: 'border-cyber-green/40 bg-cyber-green/15 text-green-100 shadow-[0_0_64px_rgba(34,197,94,0.3)]',
  blue: 'border-cyber-blue/40 bg-cyber-blue/15 text-blue-100 shadow-[0_0_64px_rgba(59,130,246,0.3)]',
}

export default function ActionNotice({ notice }) {
  if (!notice) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-cyber-background/45 px-6 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg border px-8 py-7 text-center ${toneClasses[notice.tone] ?? toneClasses.blue}`}>
        <BrandLoader text="" tone={notice.tone} fullScreen={false} />
        <p className="mt-5 text-xl font-semibold">{notice.title}</p>
        <p className="mt-2 text-sm text-cyber-muted">{notice.message}</p>
      </div>
    </div>
  )
}
