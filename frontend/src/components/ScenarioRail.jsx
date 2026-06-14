import { Crosshair, Radio, ShieldAlert } from 'lucide-react'
import StatusPill from './StatusPill'

const riskTone = {
  Critical: 'red',
  High: 'yellow',
  Medium: 'blue',
}

export default function ScenarioRail({ scenarios, selectedScenarioId, onSelect }) {
  return (
    <div className="space-y-3">
      {scenarios.map((scenario) => {
        const selected = scenario.id === selectedScenarioId

        return (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onSelect(scenario.id)}
            className={`w-full rounded-lg border p-3 text-left transition ${
              selected
                ? 'border-cyber-blue bg-cyber-blue/10 shadow-glowBlue'
                : 'border-cyber-border bg-cyber-panelSoft hover:border-cyber-blue/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-md border border-cyber-border bg-cyber-background p-2 text-cyber-blue">
                {scenario.type === 'MITM' ? (
                  <Radio className="h-4 w-4" aria-hidden="true" />
                ) : scenario.type === 'Credential Attack' ? (
                  <Crosshair className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-cyber-text">{scenario.name}</span>
                <span className="mt-1 block truncate text-xs text-cyber-muted">
                  {scenario.type} / {scenario.target}
                </span>
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill tone={selected ? 'blue' : 'slate'}>{scenario.status}</StatusPill>
              <StatusPill tone={riskTone[scenario.risk]}>{scenario.risk}</StatusPill>
            </div>
          </button>
        )
      })}
    </div>
  )
}
