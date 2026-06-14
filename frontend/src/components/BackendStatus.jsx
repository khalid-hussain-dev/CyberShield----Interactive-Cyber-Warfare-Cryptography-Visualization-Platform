import { Server, WifiOff } from 'lucide-react'
import StatusPill from './StatusPill'


export default function BackendStatus({ health }) {
  const online = health.status === 'online'
  const checking = health.status === 'checking'
  const tone = online ? 'green' : checking ? 'yellow' : 'red'
  const label = online ? 'API Online' : checking ? 'API Checking' : 'API Offline'
  const Icon = online ? Server : WifiOff

  return (
    <div className="flex min-w-[220px] items-center gap-3 rounded-lg border border-cyber-border bg-cyber-panelSoft px-3 py-2">
      <Icon className={`h-4 w-4 ${online ? 'text-cyber-green' : 'text-cyber-yellow'}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusPill tone={tone}>{label}</StatusPill>
          {health.version ? <span className="text-xs text-cyber-muted">v{health.version}</span> : null}
        </div>
        <p className="mt-1 truncate text-xs text-cyber-muted">{health.service ?? health.message}</p>
      </div>
    </div>
  )
}
