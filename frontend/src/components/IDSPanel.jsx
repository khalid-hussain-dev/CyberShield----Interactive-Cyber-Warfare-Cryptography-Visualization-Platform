import { useState, useCallback } from 'react'
import { ShieldCheck, ShieldAlert, AlertTriangle, Cpu, RefreshCw } from 'lucide-react'

const LABEL_CONFIG = {
  Normal:     { icon: ShieldCheck,  bg: 'bg-cyber-green/10',  border: 'border-cyber-green/30',  text: 'text-green-200',  dot: 'bg-cyber-green'  },
  Suspicious: { icon: AlertTriangle, bg: 'bg-cyber-yellow/10', border: 'border-cyber-yellow/30', text: 'text-yellow-200', dot: 'bg-cyber-yellow' },
  Attack:     { icon: ShieldAlert,  bg: 'bg-cyber-red/10',   border: 'border-cyber-red/30',   text: 'text-red-200',    dot: 'bg-cyber-red'   },
}

function ConfidenceBar({ confidence, label }) {
  const cfg = LABEL_CONFIG[label] || LABEL_CONFIG.Normal
  const barColor = label === 'Attack' ? 'bg-cyber-red' : label === 'Suspicious' ? 'bg-cyber-yellow' : 'bg-cyber-green'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="h-1.5 flex-1 rounded-full bg-cyber-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="shrink-0 font-mono text-[10px] text-cyber-muted">{confidence}%</span>
    </div>
  )
}

export default function IDSPanel({ packets = [], token }) {
  const [results, setResults] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analyzed, setAnalyzed] = useState(false)

  const runAnalysis = useCallback(async () => {
    if (packets.length === 0) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ids/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packets }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'IDS analysis failed')
      setResults(data.data.results)
      setSummary(data.data.summary)
      setAnalyzed(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [packets, token])

  if (packets.length === 0) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-lg border border-cyber-border bg-cyber-panelSoft p-4 text-center text-cyber-muted">
        <Cpu className="h-8 w-8 animate-pulse text-cyber-blue" />
        <p className="text-sm font-semibold">AI-IDS Engine Ready</p>
        <p className="text-xs">Launch the Packet Sniffing scenario to run live traffic analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header with Analyze button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-cyber-blue" />
          <span className="text-xs font-semibold text-cyber-text">
            Isolation Forest Model · {packets.length} packet{packets.length !== 1 ? 's' : ''} queued
          </span>
        </div>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded border border-cyber-blue bg-cyber-panelSoft px-3 py-1 text-[11px] font-semibold text-cyber-blue transition hover:bg-cyber-blue hover:text-cyber-background disabled:opacity-60"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing…' : analyzed ? 'Re-Analyze' : 'Run IDS'}
        </button>
      </div>

      {error && (
        <p className="rounded border border-cyber-red/30 bg-cyber-red/10 px-3 py-2 text-[11px] text-red-200">{error}</p>
      )}

      {/* Summary badges */}
      {summary && (
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase">
          <div className="rounded border border-cyber-green/30 bg-cyber-green/10 py-1.5 text-green-200">
            ✓ Normal <span className="ml-1 text-base font-bold">{summary.normal}</span>
          </div>
          <div className="rounded border border-cyber-yellow/30 bg-cyber-yellow/10 py-1.5 text-yellow-200">
            ⚠ Suspicious <span className="ml-1 text-base font-bold">{summary.suspicious}</span>
          </div>
          <div className="rounded border border-cyber-red/30 bg-cyber-red/10 py-1.5 text-red-200">
            ✕ Attack <span className="ml-1 text-base font-bold">{summary.attack}</span>
          </div>
        </div>
      )}

      {/* Per-packet results */}
      {results.length > 0 && (
        <div className="max-h-[280px] overflow-y-auto space-y-2">
          {results.map((result, i) => {
            const cfg = LABEL_CONFIG[result.label] || LABEL_CONFIG.Normal
            const Icon = cfg.icon
            const packet = packets[i] || {}
            return (
              <div
                key={i}
                className={`rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2 text-xs`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${cfg.dot}`}>
                      <Icon className="h-2.5 w-2.5 text-cyber-background" />
                    </span>
                    <span className={`font-bold ${cfg.text}`}>{result.label}</span>
                    <span className="text-cyber-muted truncate">
                      {packet.label || packet.source || `Packet ${i + 1}`}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-cyber-muted">
                    entropy: {result.features?.payload_entropy ?? '—'}
                  </span>
                </div>
                <ConfidenceBar confidence={result.confidence} label={result.label} />
                <p className="mt-1 font-mono text-[10px] text-cyber-muted">
                  {packet.src_ip || packet.source} → {packet.dst_ip || packet.target} · port {result.features?.dst_port ?? '—'} · {packet.layer_summary || packet.protocol}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {!analyzed && !loading && (
        <p className="text-center text-[11px] text-cyber-muted">
          Click <span className="font-semibold text-cyber-blue">Run IDS</span> to classify the captured traffic.
        </p>
      )}
    </div>
  )
}
