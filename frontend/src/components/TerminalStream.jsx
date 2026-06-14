import { useEffect, useRef } from 'react'

export default function TerminalStream({ entries, tone = 'green' }) {
  const streamRef = useRef(null)

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight
    }
  }, [entries])

  const toneClass = tone === 'red' ? 'text-red-200' : 'text-green-200'

  return (
    <div
      ref={streamRef}
      className="h-64 overflow-y-auto rounded-lg border border-cyber-border bg-[#070B15] p-3 font-mono text-xs leading-6"
    >
      {entries.map((entry) => (
        <p key={entry} className={toneClass}>
          <span className="mr-2 text-cyber-muted">&gt;</span>
          {entry}
        </p>
      ))}
    </div>
  )
}
