import { motion } from 'framer-motion'
import { AlertCircle, ArrowRightLeft, ShieldAlert, ShieldCheck, Terminal } from 'lucide-react'

export default function ScenarioTimeline({ events = [] }) {
  if (events.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-cyber-border bg-cyber-panelSoft p-4 text-center text-cyber-muted">
        <ArrowRightLeft className="mb-2 h-8 w-8 animate-pulse text-cyber-blue" />
        <p className="text-sm font-semibold">Live Simulation Timeline</p>
        <p className="mt-1 text-xs">Events will populate chronologically when you launch an attack.</p>
      </div>
    )
  }

  // Filter events to exclude duplicates or irrelevant items if needed, but rendering all gives a complete audit trail
  return (
    <div className="max-h-[300px] overflow-y-auto rounded-lg border border-cyber-border bg-[#070B15] p-4 font-sans text-xs">
      <div className="relative border-l border-cyber-border pl-4">
        {events.map((event, index) => {
          let Icon = ArrowRightLeft
          let dotColor = 'border-cyber-blue bg-cyber-background text-cyber-blue'
          let textColor = 'text-cyber-muted'

          if (event.kind === 'alert') {
            Icon = event.severity === 'Critical' || event.severity === 'High' ? ShieldAlert : AlertCircle
            dotColor = 'border-cyber-red bg-cyber-panelSoft text-cyber-red shadow-[0_0_10px_rgba(239,68,68,0.3)]'
            textColor = 'text-red-200 font-semibold'
          } else if (event.kind === 'log') {
            Icon = Terminal
            if (event.channel === 'hacker') {
              dotColor = 'border-cyber-red bg-cyber-background text-cyber-red'
              textColor = 'text-cyber-muted'
            } else {
              dotColor = 'border-cyber-green bg-cyber-background text-cyber-green'
              textColor = 'text-cyber-text'
            }
          } else if (event.kind === 'status') {
            Icon = ShieldCheck
            dotColor = 'border-cyber-green bg-cyber-panelSoft text-cyber-green shadow-[0_0_10px_rgba(34,197,94,0.3)]'
            textColor = 'text-green-200 font-semibold'
          }

          return (
            <motion.div
              key={event.id ?? index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="relative mb-4 last:mb-0"
            >
              {/* Timeline dot */}
              <span className={`absolute -left-[27px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border bg-cyber-panelSoft text-[10px] ${dotColor}`}>
                <Icon className="h-3 w-3" />
              </span>

              {/* Event Content */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className={textColor}>{event.message}</span>
                <span className="shrink-0 font-mono text-[10px] text-cyber-muted">{event.time}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
