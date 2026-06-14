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

const accentGradients = {
  blue: 'from-cyber-blue to-transparent',
  green: 'from-cyber-green to-transparent',
  red: 'from-cyber-red to-transparent',
  yellow: 'from-cyber-yellow to-transparent',
}

export default function MetricCard({ metric }) {
  const Icon = icons[metric.tone] ?? Activity
  const accentGradient = accentGradients[metric.tone] ?? accentGradients.blue

  return (
    <article className="relative rounded-lg border border-cyber-border bg-cyber-panel px-4 py-4 pt-5 overflow-hidden">
      {/* Colored top border accent */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${accentGradient}`} />

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
