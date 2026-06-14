export default function SectionPanel({ title, icon: Icon, action, className = '', children }) {
  return (
    <section className={`panel-card ${className}`}>
      {/* Panel header */}
      <div className="panel-header">
        <div className="panel-header-left">
          {Icon ? (
            <span className="panel-icon-ring">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          ) : null}
          <h2 className="panel-title">{title}</h2>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {/* Panel body */}
      <div className="panel-body">{children}</div>
    </section>
  )
}
