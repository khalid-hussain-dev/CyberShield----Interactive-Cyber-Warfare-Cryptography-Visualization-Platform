import { Activity, ShieldCheck, Siren, Wifi } from 'lucide-react'

const icons = {
  red: Siren,
  green: ShieldCheck,
  blue: Wifi,
  yellow: Activity,
}

const toneClasses = {
  red: 'text-cyber-red shadow-glowRed',
  green: 'text-cyber-green shadow-glowGreen',
  blue: 'text-cyber-blue shadow-glowBlue',
  yellow: 'text-cyber-yellow',
}

export default function MetricCard({ metric }) {
  const Icon = icons[metric.tone] ?? Activity

  return (
    <article className="rounded-lg border border-cyber-border bg-cyber-panel px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-cyber-muted">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold leading-none text-cyber-text">{metric.value}</p>
        </div>
        <span className={`rounded-md border border-cyber-border bg-cyber-panelSoft p-2 ${toneClasses[metric.tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 truncate text-sm text-cyber-muted">{metric.trend}</p>
    </article>
  )
}
