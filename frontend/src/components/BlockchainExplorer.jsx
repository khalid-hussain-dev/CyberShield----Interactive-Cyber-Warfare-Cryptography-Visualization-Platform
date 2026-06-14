import { useState, useEffect, useCallback } from 'react'
import { Link, Shield, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'

function BlockCard({ block, isLast }) {
  const payload = block.payload || {}
  const hashShort = block.block_hash ? block.block_hash.slice(0, 16) + '…' : '—'
  const prevShort = block.prev_hash
    ? block.prev_hash === '0'.repeat(64)
      ? 'GENESIS'
      : block.prev_hash.slice(0, 12) + '…'
    : '—'

  return (
    <div className="relative flex flex-col gap-1">
      <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-3 text-xs">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-mono text-[10px] font-bold text-cyber-blue">BLOCK #{block.block_index}</span>
          <span className="text-[10px] text-cyber-muted">{(block.created_at || '').slice(0, 16).replace('T', ' ')}</span>
        </div>
        <p className="font-semibold text-cyber-text truncate">{payload.scenario_name || 'Unknown Scenario'}</p>
        <div className="flex gap-3 mt-1 text-[10px] text-cyber-muted">
          <span>Risk Before: <span className="text-red-300 font-mono">{payload.risk_score_before ?? '—'}</span></span>
          <span>Risk After: <span className="text-green-300 font-mono">{payload.risk_score_after ?? '—'}</span></span>
        </div>
        <div className="mt-2 space-y-0.5 font-mono text-[9px]">
          <p className="text-cyber-muted">prev: <span className="text-cyber-blue">{prevShort}</span></p>
          <p className="text-cyber-muted">hash: <span className="text-cyber-text">{hashShort}</span></p>
        </div>
      </div>
      {/* Chain link arrow */}
      {!isLast && (
        <div className="flex justify-center">
          <div className="h-4 w-px bg-cyber-blue/40" />
        </div>
      )}
    </div>
  )
}

export default function BlockchainExplorer({ token }) {
  const [chain, setChain] = useState([])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [tampering, setTampering] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  const [error, setError] = useState(null)

  const loadChain = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/blockchain/chain', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load chain')
      setChain(data.data.chain)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const verifyChain = async () => {
    setVerifying(true)
    setVerifyResult(null)
    try {
      const res = await fetch('/api/blockchain/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Verification failed')
      setVerifyResult(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  const tamperChain = async () => {
    if (!window.confirm("This will simulate direct database tampering by altering the latest report block's risk score without updating its cryptographic hash. Proceed?")) return
    setTampering(true)
    try {
      const res = await fetch('/api/blockchain/tamper', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Tamper simulation failed')
      setVerifyResult(null)
      await loadChain()
    } catch (err) {
      setError(err.message)
    } finally {
      setTampering(false)
    }
  }

  const restoreChain = async () => {
    setRestoring(true)
    try {
      const res = await fetch('/api/blockchain/restore', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Restore simulation failed')
      setVerifyResult(null)
      await loadChain()
    } catch (err) {
      setError(err.message)
    } finally {
      setRestoring(false)
    }
  }

  useEffect(() => {
    loadChain()
  }, [loadChain])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-cyber-blue" />
          <span className="text-xs font-semibold text-cyber-text">
            {chain.length} Block{chain.length !== 1 ? 's' : ''} · SHA-256 Hash-Chain
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={tamperChain}
            disabled={tampering || chain.length === 0}
            className="inline-flex items-center gap-1.5 rounded border border-cyber-red/60 bg-cyber-panelSoft px-2 py-1 text-[11px] font-semibold text-cyber-red transition hover:bg-cyber-red hover:text-cyber-background disabled:opacity-50"
          >
            <AlertTriangle className={`h-3 w-3 ${tampering ? 'animate-pulse' : ''}`} />
            Tamper Log
          </button>
          <button
            type="button"
            onClick={restoreChain}
            disabled={restoring || chain.length === 0}
            className="inline-flex items-center gap-1.5 rounded border border-cyber-green/60 bg-cyber-panelSoft px-2 py-1 text-[11px] font-semibold text-cyber-green transition hover:bg-cyber-green hover:text-cyber-background disabled:opacity-50"
          >
            <CheckCircle className={`h-3 w-3 ${restoring ? 'animate-pulse' : ''}`} />
            Restore Log
          </button>
          <button
            type="button"
            onClick={verifyChain}
            disabled={verifying || chain.length === 0}
            className="inline-flex items-center gap-1.5 rounded border border-cyber-blue/60 bg-cyber-panelSoft px-2.5 py-1 text-[11px] font-semibold text-cyber-blue transition hover:bg-cyber-blue hover:text-cyber-background disabled:opacity-50"
          >
            <Shield className={`h-3 w-3 ${verifying ? 'animate-pulse' : ''}`} />
            Verify Chain
          </button>
          <button
            type="button"
            onClick={loadChain}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded border border-cyber-border bg-cyber-panelSoft px-2 py-1 text-[11px] text-cyber-muted transition hover:border-cyber-blue hover:text-cyber-blue disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Verify result toast */}
      {verifyResult && (
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
          verifyResult.valid
            ? 'border-cyber-green/30 bg-cyber-green/10 text-green-200'
            : 'border-cyber-red/30 bg-cyber-red/10 text-red-200'
        }`}>
          {verifyResult.valid
            ? <><CheckCircle className="h-4 w-4 shrink-0" /> Chain Integrity VERIFIED — all {verifyResult.total_blocks} block hashes are valid</>
            : <><XCircle className="h-4 w-4 shrink-0" /> Chain TAMPERED — integrity broken at block #{verifyResult.broken_at}</>
          }
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-300">{error}</p>
      )}

      {/* Chain blocks */}
      {chain.length === 0 && !loading ? (
        <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-lg border border-cyber-border bg-cyber-panelSoft p-4 text-center text-cyber-muted">
          <Link className="h-7 w-7 text-cyber-blue/50" />
          <p className="text-xs">No blocks yet. Export a report to mint the first block.</p>
        </div>
      ) : (
        <div className="max-h-[360px] overflow-y-auto pr-1 space-y-0">
          {[...chain].reverse().map((block, i) => (
            <BlockCard key={block.id} block={block} isLast={i === chain.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}
