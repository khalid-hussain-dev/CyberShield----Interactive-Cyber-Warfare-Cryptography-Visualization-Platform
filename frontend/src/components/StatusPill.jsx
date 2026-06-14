const toneClasses = {
  blue: 'border-cyber-blue/40 bg-cyber-blue/10 text-blue-200',
  green: 'border-cyber-green/40 bg-cyber-green/10 text-green-200',
  red: 'border-cyber-red/40 bg-cyber-red/10 text-red-200',
  yellow: 'border-cyber-yellow/40 bg-cyber-yellow/10 text-yellow-100',
  slate: 'border-cyber-border bg-cyber-panelSoft text-cyber-muted',
}

export default function StatusPill({ children, tone = 'slate' }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}
