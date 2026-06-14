import { BookOpen, CheckCircle2, Crosshair } from 'lucide-react'
import StatusPill from './StatusPill'

function StepList({ title, icon: Icon, steps, tone }) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-3">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tone === 'red' ? 'text-cyber-red' : 'text-cyber-green'}`} aria-hidden="true" />
        <p className="text-sm font-semibold text-cyber-text">{title}</p>
      </div>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2 text-sm text-cyber-muted">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-cyber-border bg-cyber-background text-[11px] text-cyber-text">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function ExplainModePanel({ explanation }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <BookOpen className="h-4 w-4 text-cyber-blue" aria-hidden="true" />
        <StatusPill tone="blue">{explanation.concept}</StatusPill>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="rounded-lg border border-cyber-red/30 bg-cyber-red/10 p-3">
          <p className="text-sm font-semibold text-red-100">Attack Purpose</p>
          <p className="mt-2 text-sm leading-6 text-cyber-muted">{explanation.attackSummary}</p>
        </div>
        <div className="rounded-lg border border-cyber-green/30 bg-cyber-green/10 p-3">
          <p className="text-sm font-semibold text-green-100">Defense Purpose</p>
          <p className="mt-2 text-sm leading-6 text-cyber-muted">{explanation.defenseSummary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <StepList title="Attack Flow" icon={Crosshair} steps={explanation.attackSteps} tone="red" />
        <StepList title="Defense Flow" icon={CheckCircle2} steps={explanation.defenseSteps} tone="green" />
      </div>

      <div className="rounded-lg border border-cyber-blue/30 bg-cyber-blue/10 p-3">
        <p className="text-sm font-semibold text-blue-100">Key Takeaway</p>
        <p className="mt-2 text-sm leading-6 text-cyber-muted">{explanation.takeaway}</p>
      </div>
    </div>
  )
}
