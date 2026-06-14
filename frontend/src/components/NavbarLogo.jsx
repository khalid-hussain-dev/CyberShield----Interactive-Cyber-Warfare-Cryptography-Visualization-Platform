const toneClasses = {
  blue: 'border-cyber-blue/60 bg-cyber-blue/10 shadow-[0_0_26px_rgba(59,130,246,0.36)]',
  red: 'border-cyber-red/70 bg-cyber-red/10 shadow-[0_0_30px_rgba(239,68,68,0.45)]',
  green: 'border-cyber-green/70 bg-cyber-green/10 shadow-[0_0_30px_rgba(34,197,94,0.42)]',
}

export default function NavbarLogo({ tone = 'blue' }) {
  return (
    <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border p-1.5 ${toneClasses[tone] ?? toneClasses.blue}`}>
      <img src="/logos/favicon.png" alt="CyberShield" className="h-full w-full rounded-md object-contain" />
    </span>
  )
}
