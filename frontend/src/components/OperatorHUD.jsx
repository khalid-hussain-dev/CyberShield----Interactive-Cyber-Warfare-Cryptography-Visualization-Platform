import { useState, useEffect, useCallback } from 'react'
import { Trophy, Star, Zap, Shield, X } from 'lucide-react'

const RANK_COLORS = {
  Trainee:  'text-cyber-muted border-cyber-muted/40',
  Analyst:  'text-cyber-blue border-cyber-blue/40',
  Defender: 'text-cyber-green border-cyber-green/40',
  Expert:   'text-cyber-yellow border-cyber-yellow/40',
  Elite:    'text-cyber-red border-cyber-red/40',
}

const RANK_ICONS = {
  Trainee: '🎓', Analyst: '🔍', Defender: '🛡️', Expert: '⚡', Elite: '👑',
}

export function OperatorScore({ token, scoreRef }) {
  const [score, setScore] = useState(null)
  const [xpFlash, setXpFlash] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/scores/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        const newScore = data.data.score
        setScore((prev) => {
          if (prev && newScore.xp > prev.xp) {
            setXpFlash(`+${newScore.xp - prev.xp} XP`)
            setTimeout(() => setXpFlash(null), 2000)
          }
          return newScore
        })
      }
    } catch {
      // non-critical
    }
  }, [token])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Expose refresh so parent can call it after scoring events
  useEffect(() => {
    if (scoreRef) scoreRef.current = refresh
  }, [scoreRef, refresh])

  if (!score) {
    return (
      <div className="inline-flex items-center gap-2.5 rounded-lg border border-cyber-muted/30 bg-cyber-panelSoft px-3 py-1.5 text-xs opacity-50">
        <span className="text-base leading-none">⏳</span>
        <div className="min-w-0">
          <p className="font-bold leading-tight">Loading...</p>
          <div className="h-1 w-16 rounded-full bg-cyber-border mt-1 animate-pulse" />
        </div>
      </div>
    )
  }

  const colorClass = RANK_COLORS[score.rank] || RANK_COLORS.Trainee
  const nextInfo = score.next_rank_info || {}
  const xpToNext = nextInfo.xp_needed ?? 0
  const nextThreshold = nextInfo.next_threshold ?? score.xp
  const xpInCurrentTier = nextThreshold - xpToNext
  const progress = nextThreshold > 0
    ? Math.min(100, Math.round((score.xp / nextThreshold) * 100))
    : 100

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className={`relative inline-flex items-center gap-2.5 rounded-lg border bg-cyber-panelSoft px-3 py-1.5 text-xs cursor-pointer select-none transition hover:bg-cyber-panel/60 ${colorClass}`}
        title="Click to view Achievement details"
      >
        <span className="text-base leading-none">{RANK_ICONS[score.rank] || '🎓'}</span>
        <div className="min-w-0">
          <p className="font-bold leading-tight">{score.rank}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1 w-16 rounded-full bg-cyber-border overflow-hidden">
              <div
                className="h-full rounded-full bg-current transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-[9px] opacity-70">{score.xp} XP</span>
          </div>
        </div>
        {/* XP flash animation */}
        {xpFlash && (
          <span className="absolute -top-5 right-1 animate-bounce text-[11px] font-bold text-cyber-green">
            {xpFlash}
          </span>
        )}
      </div>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg border border-cyber-border bg-cyber-panel p-5 text-cyber-text shadow-2xl relative animate-scale-up"
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-cyber-muted hover:text-cyber-text"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-blue flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-cyber-yellow" />
              Achievement System
            </h3>
            
            <div className="space-y-4 text-[11px] leading-relaxed">
              <div>
                <p className="font-bold text-cyber-text mb-2 border-b border-cyber-border pb-1">XP PROGRESSION TIERS</p>
                <div className="grid grid-cols-1 gap-1.5 font-mono">
                  <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-cyber-background/30"><span className="flex items-center gap-1">🎓 Trainee</span> <span className="text-cyber-muted font-bold">0 - 49 XP</span></div>
                  <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-cyber-background/30"><span className="flex items-center gap-1">🔍 Analyst</span> <span className="text-cyber-blue font-bold">50 - 149 XP</span></div>
                  <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-cyber-background/30"><span className="flex items-center gap-1">🛡️ Defender</span> <span className="text-cyber-green font-bold">150 - 349 XP</span></div>
                  <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-cyber-background/30"><span className="flex items-center gap-1">⚡ Expert</span> <span className="text-cyber-yellow font-bold">350 - 699 XP</span></div>
                  <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-cyber-background/30"><span className="flex items-center gap-1">👑 Elite</span> <span className="text-cyber-red font-bold">700+ XP</span></div>
                </div>
              </div>
              
              <div>
                <p className="font-bold text-cyber-text mb-2 border-b border-cyber-border pb-1">TASK REWARDS</p>
                <ul className="space-y-1.5 font-mono text-[10px]">
                  <li className="flex justify-between items-center bg-cyber-panelSoft/60 p-1.5 rounded border border-cyber-border/40">
                    <span>🚀 Launch Simulation</span>
                    <span className="text-cyber-blue font-bold">+10 XP</span>
                  </li>
                  <li className="flex justify-between items-center bg-cyber-panelSoft/60 p-1.5 rounded border border-cyber-border/40">
                    <span>🛡️ Deploy Defensive Rules</span>
                    <span className="text-cyber-green font-bold">+25 XP</span>
                  </li>
                  <li className="flex justify-between items-center bg-cyber-panelSoft/60 p-1.5 rounded border border-cyber-border/40">
                    <span>📄 Export Audit Report</span>
                    <span className="text-cyber-yellow font-bold">+15 XP</span>
                  </li>
                </ul>
              </div>
              
              <p className="text-[10px] text-cyber-muted bg-cyber-background/40 p-2 rounded">
                Experience points accumulate per session. Work on different scenarios, test cryptographic mechanisms, and save reports to level up.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function Leaderboard({ token }) {
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/scores/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setBoard(data.data.leaderboard)
    } catch {
      // non-critical
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="h-3.5 w-3.5 text-cyber-yellow" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted">Live Leaderboard</span>
      </div>
      {loading && <p className="text-center text-xs text-cyber-muted py-4">Loading…</p>}
      {!loading && board.length === 0 && (
        <p className="text-center text-xs text-cyber-muted py-4">No operators ranked yet.</p>
      )}
      {board.map((entry) => {
        const colorClass = RANK_COLORS[entry.rank] || RANK_COLORS.Trainee
        return (
          <div
            key={entry.username}
            className="flex items-center gap-2.5 rounded-lg border border-cyber-border bg-cyber-panelSoft px-3 py-2 text-xs"
          >
            <span className="w-5 shrink-0 text-center font-mono text-[10px] font-bold text-cyber-muted">
              #{entry.position}
            </span>
            <span className="text-base leading-none">{RANK_ICONS[entry.rank] || '🎓'}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-cyber-text">{entry.username}</p>
              <p className={`text-[10px] ${colorClass.split(' ')[0]}`}>{entry.rank}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono font-bold text-cyber-blue">{entry.xp} XP</p>
              <p className="text-[9px] text-cyber-muted">{entry.defenses_deployed}🛡 {entry.attacks_blocked}⚡</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
