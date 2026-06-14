const toneClasses = {
  blue: {
    glow: 'shadow-[0_0_46px_rgba(59,130,246,0.45)]',
    ring: 'border-cyber-blue border-t-transparent',
    text: 'text-blue-100',
    haze: 'bg-cyber-blue/20',
  },
  red: {
    glow: 'shadow-[0_0_54px_rgba(239,68,68,0.5)]',
    ring: 'border-cyber-red border-t-transparent',
    text: 'text-red-100',
    haze: 'bg-cyber-red/20',
  },
  green: {
    glow: 'shadow-[0_0_54px_rgba(34,197,94,0.45)]',
    ring: 'border-cyber-green border-t-transparent',
    text: 'text-green-100',
    haze: 'bg-cyber-green/20',
  },
}

export default function BrandLoader({ text = 'Loading', tone = 'blue', fullScreen = true }) {
  const classes = toneClasses[tone] ?? toneClasses.blue
  const Wrapper = fullScreen ? 'div' : 'span'

  return (
    <Wrapper
      className={
        fullScreen
          ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-cyber-background/95 px-6 text-center backdrop-blur'
          : 'flex flex-col items-center justify-center text-center'
      }
    >
      <span className={`relative flex h-36 w-36 items-center justify-center rounded-full ${classes.haze} ${classes.glow}`}>
        <span className={`absolute inset-0 rounded-full border-4 ${classes.ring} animate-spin`} />
        <img
          src="/logos/login_logo.png"
          alt="CyberShield"
          className="h-24 w-24 rounded-full object-contain"
        />
      </span>
      {text ? <span className={`mt-5 text-sm font-semibold uppercase tracking-[0.18em] ${classes.text}`}>{text}</span> : null}
    </Wrapper>
  )
}
