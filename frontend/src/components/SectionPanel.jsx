const toneColors = {
  blue: 'from-cyber-blue to-transparent',
  green: 'from-cyber-green to-transparent',
  red: 'from-cyber-red to-transparent',
  yellow: 'from-cyber-yellow to-transparent',
}

export default function SectionPanel({ title, icon: Icon, action, tone = 'blue', className = '', children }) {
  const accentColor = toneColors[tone] ?? toneColors.blue

  return (
    <section className={`relative rounded-lg border border-cyber-border bg-cyber-panel shadow-panel overflow-hidden ${className}`}>
      {/* Colored top border accent */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${accentColor}`} />

      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-cyber-border px-4 py-3 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-cyber-blue" aria-hidden="true" /> : null}
          <h2 className="truncate text-sm font-semibold text-cyber-text">{title}</h2>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}
