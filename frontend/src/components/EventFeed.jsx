import StatusPill from './StatusPill'

const severityTone = {
  Critical: 'red',
  High: 'yellow',
  Medium: 'blue',
  Low: 'green',
}

export default function EventFeed({ alerts }) {
  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div key={`${alert.time}-${alert.title}`} className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cyber-text">{alert.title}</p>
              <p className="mt-1 text-xs text-cyber-muted">{alert.time}</p>
            </div>
            <StatusPill tone={severityTone[alert.severity]}>{alert.severity}</StatusPill>
          </div>
        </div>
      ))}
    </div>
  )
}
