/**
 * DuelArena.jsx
 * Real-time split-screen 2-player cyber battle arena.
 * Left = Attacker, Right = Defender.
 */
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Shield, Skull, Trophy, Zap } from 'lucide-react'
import useDuelSocket from '../hooks/useDuelSocket'

// ─── Attack card ─────────────────────────────────────────────────────────────
function AttackCard({ id, label, description, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onClick(id)}
      className={`group relative w-full rounded-xl border p-4 text-left transition ${
        disabled
          ? 'border-cyber-border bg-cyber-panelSoft opacity-40 cursor-not-allowed'
          : 'border-cyber-border bg-cyber-panelSoft hover:border-cyber-red hover:bg-cyber-red/5 cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyber-red/10 border border-cyber-red/20">
          <Skull className="h-4 w-4 text-cyber-red" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-cyber-text">{label}</p>
          <p className="text-xs text-cyber-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      {!disabled && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-xl bg-gradient-to-r from-transparent via-cyber-red to-transparent opacity-0 group-hover:opacity-100 transition" />
      )}
    </button>
  )
}

// ─── Defense card ─────────────────────────────────────────────────────────────
function DefenseCard({ id, label, description, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onClick(id)}
      className={`group relative w-full rounded-xl border p-4 text-left transition ${
        disabled
          ? 'border-cyber-border bg-cyber-panelSoft opacity-40 cursor-not-allowed'
          : 'border-cyber-border bg-cyber-panelSoft hover:border-cyber-green hover:bg-cyber-green/5 cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyber-green/10 border border-cyber-green/20">
          <Shield className="h-4 w-4 text-cyber-green" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-cyber-text">{label}</p>
          <p className="text-xs text-cyber-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      {!disabled && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-xl bg-gradient-to-r from-transparent via-cyber-green to-transparent opacity-0 group-hover:opacity-100 transition" />
      )}
    </button>
  )
}

// ─── Score ticker ─────────────────────────────────────────────────────────────
function ScoreTicker({ room }) {
  const attacker = room?.attacker
  const defender = room?.defender
  const round = room?.current_round

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-cyber-border bg-cyber-panel px-6 py-3">
      {/* Attacker */}
      <div className="flex items-center gap-3">
        <Skull className="h-5 w-5 text-cyber-red" />
        <div>
          <p className="text-xs text-cyber-muted font-semibold uppercase">Attacker</p>
          <p className="text-sm font-bold text-cyber-text">{attacker?.username ?? '—'}</p>
        </div>
        <div className="ml-2 text-right">
          <p className="font-mono text-2xl font-black text-cyber-red">{attacker?.score ?? 0}</p>
          <p className="text-[10px] text-cyber-muted">{attacker?.rounds_won ?? 0} rounds won</p>
        </div>
      </div>

      {/* Round indicator */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase text-cyber-muted">Round</p>
        <p className="font-mono text-3xl font-black text-cyber-text">{round?.number ?? 1}</p>
        <p className="text-[10px] text-cyber-muted">of 3</p>
      </div>

      {/* Defender */}
      <div className="flex items-center gap-3 flex-row-reverse">
        <Shield className="h-5 w-5 text-cyber-green" />
        <div className="text-right">
          <p className="text-xs text-cyber-muted font-semibold uppercase">Defender</p>
          <p className="text-sm font-bold text-cyber-text">{defender?.username ?? '—'}</p>
        </div>
        <div className="mr-2 text-left">
          <p className="font-mono text-2xl font-black text-cyber-green">{defender?.score ?? 0}</p>
          <p className="text-[10px] text-cyber-muted">{defender?.rounds_won ?? 0} rounds won</p>
        </div>
      </div>
    </div>
  )
}

// ─── Round result flash ───────────────────────────────────────────────────────
function RoundResultFlash({ result, role }) {
  if (!result || !result.breach_success) return null

  const isAttacker = role === 'attacker'
  const attackWon = result.breach_success
  const youWon = (isAttacker && attackWon) || (!isAttacker && !attackWon)

  return (
    <div className={`rounded-xl border px-5 py-4 ${
      youWon
        ? 'border-cyber-green/40 bg-cyber-green/10'
        : 'border-cyber-red/40 bg-cyber-red/10'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${youWon ? 'text-cyber-green' : 'text-cyber-red'}`}>
          {youWon ? '✓' : '✗'}
        </div>
        <div>
          <p className={`font-bold text-sm ${youWon ? 'text-cyber-green' : 'text-cyber-red'}`}>
            {youWon ? 'You won this round!' : 'You lost this round!'}
          </p>
          <p className="text-xs text-cyber-muted mt-0.5">
            Attack: <span className="text-cyber-text font-semibold">{result.attack_type?.replace(/_/g, ' ')}</span>
            {' vs '}
            Defense: <span className="text-cyber-text font-semibold">{result.defense_type?.replace(/_/g, ' ')}</span>
          </p>
          <p className="text-xs text-cyber-muted">
            {isAttacker
              ? `+${result.attacker_earned} pts`
              : `+${result.defender_earned} pts`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Game over screen ─────────────────────────────────────────────────────────
function GameOverScreen({ gameOver, role, onBack }) {
  const youWon = gameOver?.winner_role === role
  const winner = gameOver?.room?.[gameOver.winner_role]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg">
      <div className="relative w-full max-w-md mx-4 rounded-2xl border overflow-hidden text-center
        border-cyber-border bg-cyber-panel shadow-2xl">
        <div className={`h-2 w-full ${youWon ? 'bg-gradient-to-r from-cyber-green via-green-400 to-cyan-400' : 'bg-gradient-to-r from-cyber-red via-red-500 to-orange-500'}`} />

        <div className="p-10 space-y-5">
          {youWon ? (
            <Trophy className="h-20 w-20 text-cyber-yellow mx-auto animate-bounce" />
          ) : (
            <Skull className="h-20 w-20 text-cyber-red mx-auto" />
          )}

          <div>
            <p className="text-xs uppercase font-bold text-cyber-muted mb-1">Duel Result</p>
            <h2 className={`text-4xl font-black ${youWon ? 'text-cyber-green' : 'text-cyber-red'}`}>
              {youWon ? 'VICTORY!' : 'DEFEATED'}
            </h2>
          </div>

          <p className="text-sm text-cyber-muted">
            <span className="font-bold text-cyber-text">{winner?.username ?? 'Unknown'}</span>
            {' '}wins the duel as{' '}
            <span className={`font-bold ${gameOver.winner_role === 'attacker' ? 'text-cyber-red' : 'text-cyber-green'}`}>
              {gameOver.winner_role}
            </span>
          </p>

          {/* Final scores */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl border border-cyber-border bg-cyber-panelSoft p-4">
              <p className="text-xs text-cyber-muted mb-1">Attacker Score</p>
              <p className="font-mono text-2xl font-black text-cyber-red">
                {gameOver.room?.attacker?.score ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-cyber-border bg-cyber-panelSoft p-4">
              <p className="text-xs text-cyber-muted mb-1">Defender Score</p>
              <p className="font-mono text-2xl font-black text-cyber-green">
                {gameOver.room?.defender?.score ?? 0}
              </p>
            </div>
          </div>

          <p className="text-xs text-cyber-muted">XP has been awarded to your profile.</p>

          <button
            onClick={onBack}
            className="mt-2 w-full rounded-xl border border-cyber-border bg-cyber-panelSoft px-6 py-3 text-sm font-bold text-cyber-text hover:border-cyber-blue transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Waiting overlay ──────────────────────────────────────────────────────────
function WaitingOverlay({ message }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm rounded-xl z-10">
      <div className="h-10 w-10 rounded-full border-4 border-cyber-blue border-t-transparent animate-spin" />
      <p className="text-sm font-semibold text-cyber-muted">{message}</p>
    </div>
  )
}

// ─── Main Arena ───────────────────────────────────────────────────────────────
export default function DuelArena({ token, roomCode, role, onBack }) {
  const { state, sendReady, sendAttack, sendDefense } = useDuelSocket({ token, roomCode })
  const [isReady, setIsReady] = useState(false)
  const feedRef = useRef(null)
  const [feed, setFeed] = useState([])

  // Add to activity feed
  const addFeed = (msg, tone = 'blue') => {
    setFeed((prev) => [{ msg, tone, ts: Date.now() }, ...prev.slice(0, 19)])
  }

  const prevRoundRef = useRef(null)
  useEffect(() => {
    if (state.roundResult && state.roundResult !== prevRoundRef.current) {
      prevRoundRef.current = state.roundResult
      const r = state.roundResult
      if (r.breach_success) {
        addFeed(`⚡ BREACH — ${r.attack_type?.replace(/_/g, ' ')} broke through ${r.defense_type?.replace(/_/g, ' ')}`, 'red')
      } else {
        addFeed(`🛡 BLOCKED — ${r.defense_type?.replace(/_/g, ' ')} countered ${r.attack_type?.replace(/_/g, ' ')}`, 'green')
      }
    }
  }, [state.roundResult])

  const handleReady = () => {
    setIsReady(true)
    sendReady()
    addFeed('You marked yourself as ready', 'blue')
  }

  const handleAttack = (type) => {
    sendAttack(type)
    addFeed(`⚔ Fired: ${type.replace(/_/g, ' ')}`, 'red')
  }

  const handleDefense = (type) => {
    sendDefense(type)
    addFeed(`🛡 Deployed: ${type.replace(/_/g, ' ')}`, 'green')
  }

  const room = state.room
  const catalogues = state.catalogues
  const attacks = catalogues?.attacks ?? {}
  const defenses = catalogues?.defenses ?? {}
  const bothPresent = room?.full
  const bothReady = room?.attacker?.ready && room?.defender?.ready
  const roundResolved = room?.current_round?.resolved

  // Determine if this player has already made their choice this round
  const myChoiceLocked = role === 'attacker' ? state.attackLocked : state.defenseLocked
  const opponentWaiting = role === 'attacker'
    ? (state.attackLocked && !roundResolved)
    : (state.defenseLocked && !roundResolved)

  if (state.gameOver) {
    return <GameOverScreen gameOver={state.gameOver} role={role} onBack={onBack} />
  }

  return (
    <div className="min-h-screen bg-cyber-background text-cyber-text flex flex-col">
      {/* Top bar */}
      <header className="border-b border-cyber-border bg-cyber-panel px-6 py-3 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyber-muted hover:text-cyber-text transition text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Exit Duel
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyber-blue" />
            <span className="text-xs font-bold uppercase text-cyber-muted">Room</span>
            <span className="font-mono text-sm font-black text-cyber-blue tracking-widest">{roomCode}</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
          state.connected ? 'border-cyber-green/30 text-cyber-green' : 'border-cyber-red/30 text-cyber-red'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${state.connected ? 'bg-cyber-green animate-pulse' : 'bg-cyber-red'}`} />
          {state.connected ? 'Live' : 'Disconnected'}
        </div>
        <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
          role === 'attacker'
            ? 'border-cyber-red/30 bg-cyber-red/10 text-cyber-red'
            : 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green'
        }`}>
          {role === 'attacker' ? <Skull className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
          You: {role}
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-4 px-4 py-4 max-w-[1400px] mx-auto w-full">
        {/* Score ticker */}
        <ScoreTicker room={room} />

        {/* Error */}
        {state.error && (
          <div className="rounded-lg border border-cyber-red/30 bg-cyber-red/10 px-4 py-2 text-sm text-red-300">
            {state.error}
          </div>
        )}

        {/* Main battle grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px_1fr] gap-4 flex-1">
          {/* Attacker panel */}
          <div className={`relative rounded-xl border bg-cyber-panel p-5 space-y-4 ${
            role === 'attacker' ? 'border-cyber-red/50 shadow-[0_0_30px_rgba(239,68,68,0.12)]' : 'border-cyber-border'
          }`}>
            <div className="flex items-center gap-3">
              <Skull className="h-5 w-5 text-cyber-red" />
              <h3 className="font-bold text-cyber-text">Attacker</h3>
              {room?.attacker && (
                <span className="ml-auto text-xs text-cyber-muted">{room.attacker.username}</span>
              )}
              {room?.attacker?.ready && (
                <span className="rounded-full bg-cyber-green/10 border border-cyber-green/30 px-2 py-0.5 text-[10px] font-bold text-cyber-green">READY</span>
              )}
            </div>

            {!bothPresent && (
              <WaitingOverlay message="Waiting for opponent to join…" />
            )}
            {bothPresent && !bothReady && (
              <WaitingOverlay message="Waiting for both players to be ready…" />
            )}

            <div className="space-y-2">
              {Object.entries(attacks).map(([id, { label, description }]) => (
                <AttackCard
                  key={id}
                  id={id}
                  label={label}
                  description={description}
                  disabled={role !== 'attacker' || myChoiceLocked || !bothReady || roundResolved}
                  onClick={handleAttack}
                />
              ))}
            </div>

            {role === 'attacker' && myChoiceLocked && !roundResolved && (
              <p className="text-center text-xs text-cyber-muted animate-pulse">
                Waiting for defender to respond…
              </p>
            )}
          </div>

          {/* Center: activity feed + ready */}
          <div className="flex flex-col gap-3">
            {/* Ready button */}
            {!isReady && bothPresent && (
              <button
                onClick={handleReady}
                className="w-full rounded-xl bg-gradient-to-r from-cyber-blue to-blue-700 py-3 text-sm font-bold text-white hover:opacity-90 transition animate-pulse"
              >
                ✓ Ready!
              </button>
            )}
            {isReady && !bothReady && (
              <div className="rounded-xl border border-cyber-blue/30 bg-cyber-blue/10 py-3 text-center text-sm font-semibold text-cyber-blue">
                Waiting for opponent…
              </div>
            )}
            {bothReady && state.roundResult && (
              <RoundResultFlash result={state.roundResult} role={role} />
            )}

            {/* Activity feed */}
            <div className="flex-1 rounded-xl border border-cyber-border bg-cyber-panelSoft p-3 overflow-y-auto max-h-[350px]" ref={feedRef}>
              <p className="text-[10px] uppercase font-bold text-cyber-muted mb-2">Battle Log</p>
              {feed.length === 0 ? (
                <p className="text-xs text-cyber-muted text-center py-4">No events yet…</p>
              ) : (
                <div className="space-y-1.5">
                  {feed.map((entry) => (
                    <div key={entry.ts} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      entry.tone === 'red'
                        ? 'bg-cyber-red/10 text-red-300'
                        : entry.tone === 'green'
                        ? 'bg-cyber-green/10 text-green-300'
                        : 'bg-cyber-blue/10 text-blue-300'
                    }`}>
                      {entry.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* VS badge */}
            <div className="flex items-center justify-center">
              <div className="rounded-full border-2 border-cyber-border bg-cyber-panel px-4 py-2 font-black text-lg text-cyber-muted">
                VS
              </div>
            </div>
          </div>

          {/* Defender panel */}
          <div className={`relative rounded-xl border bg-cyber-panel p-5 space-y-4 ${
            role === 'defender' ? 'border-cyber-green/50 shadow-[0_0_30px_rgba(34,197,94,0.12)]' : 'border-cyber-border'
          }`}>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-cyber-green" />
              <h3 className="font-bold text-cyber-text">Defender</h3>
              {room?.defender && (
                <span className="ml-auto text-xs text-cyber-muted">{room.defender.username}</span>
              )}
              {room?.defender?.ready && (
                <span className="rounded-full bg-cyber-green/10 border border-cyber-green/30 px-2 py-0.5 text-[10px] font-bold text-cyber-green">READY</span>
              )}
            </div>

            {!bothPresent && (
              <WaitingOverlay message="Waiting for attacker to create room…" />
            )}
            {bothPresent && !bothReady && (
              <WaitingOverlay message="Waiting for both players to be ready…" />
            )}

            <div className="space-y-2">
              {Object.entries(defenses).map(([id, { label, description }]) => (
                <DefenseCard
                  key={id}
                  id={id}
                  label={label}
                  description={description}
                  disabled={role !== 'defender' || myChoiceLocked || !bothReady || roundResolved}
                  onClick={handleDefense}
                />
              ))}
            </div>

            {role === 'defender' && myChoiceLocked && !roundResolved && (
              <p className="text-center text-xs text-cyber-muted animate-pulse">
                Waiting for attacker's move…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
