import { Activity, ShieldCheck, Siren, Wifi } from 'lucide-react'

const icons = {
  red: Siren,
  green: ShieldCheck,
  blue: Wifi,
  yellow: Activity,
}

const toneStyles = {
  red: {
    iconBg: 'rgba(239,68,68,0.12)',
    iconBorder: 'rgba(239,68,68,0.30)',
    iconColor: '#ef4444',
    topBorder: 'linear-gradient(90deg, #ef4444, transparent)',
    glow: '0 0 18px rgba(239,68,68,0.15)',
  },
  green: {
    iconBg: 'rgba(52,211,153,0.12)',
    iconBorder: 'rgba(52,211,153,0.30)',
    iconColor: '#34d399',
    topBorder: 'linear-gradient(90deg, #34d399, transparent)',
    glow: '0 0 18px rgba(52,211,153,0.15)',
  },
  blue: {
    iconBg: 'rgba(59,130,246,0.12)',
    iconBorder: 'rgba(59,130,246,0.30)',
    iconColor: '#3b82f6',
    topBorder: 'linear-gradient(90deg, #3b82f6, transparent)',
    glow: '0 0 18px rgba(59,130,246,0.15)',
  },
  yellow: {
    iconBg: 'rgba(234,179,8,0.12)',
    iconBorder: 'rgba(234,179,8,0.30)',
    iconColor: '#eab308',
    topBorder: 'linear-gradient(90deg, #eab308, transparent)',
    glow: '0 0 18px rgba(234,179,8,0.12)',
  },
}

export default function MetricCard({ metric }) {
  const Icon = icons[metric.tone] ?? Activity
  const style = toneStyles[metric.tone] ?? toneStyles.blue

  return (
    <article
      className="metric-card"
      style={{ boxShadow: style.glow }}
    >
      {/* Colored top border accent */}
      <div
        className="metric-card-accent"
        style={{ background: style.topBorder }}
      />

      <div className="flex items-start justify-between gap-4 p-5 pt-6">
        <div className="min-w-0 flex-1">
          <p className="metric-card-label">{metric.label}</p>
          <p className="metric-card-value">{metric.value}</p>
          <p className="metric-card-trend">{metric.trend}</p>
        </div>

        {/* Icon ring */}
        <div
          className="metric-card-icon-ring"
          style={{
            background: style.iconBg,
            border: `1.5px solid ${style.iconBorder}`,
            color: style.iconColor,
          }}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  )
}
