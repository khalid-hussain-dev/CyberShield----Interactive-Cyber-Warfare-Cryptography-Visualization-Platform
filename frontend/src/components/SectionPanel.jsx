export default function SectionPanel({ title, icon: Icon, action, className = '', children }) {
  return (
    <section className={`rounded-lg border border-cyber-border bg-cyber-panel shadow-panel ${className}`}>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-cyber-border px-4 py-3">
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
