/**
 * DuelLobby.jsx
 * Full-screen lobby where a player creates or joins a 2-player duel room.
 */
import { useState } from 'react'
import { Copy, Sword, Users, Wifi, X } from 'lucide-react'

const SCENARIOS = [
  { id: 'bank-mitm', label: 'Bank MitM Attack' },
  { id: 'password-bruteforce', label: 'Password Brute-Force' },
  { id: 'packet-sniffing', label: 'Packet Sniffing' },
  { id: 'replay-attack', label: 'Replay Attack' },
]

export default function DuelLobby({ token, onEnterArena, onBack }) {
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [scenarioId, setScenarioId] = useState('bank-mitm')
  const [joinCode, setJoinCode] = useState('')
  const [roomCode, setRoomCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/duel/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scenario_id: scenarioId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to create room')
      setRoomCode(json.data.room_code)
      setMode('created')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) {
      setError('Room code must be 6 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/duel/rooms/${code}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to join room')
      onEnterArena({ roomCode: code, role: json.data.role })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleEnterAsHost() {
    onEnterArena({ roomCode, role: 'attacker' })
  }

  function handleCopy() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-cyber-border bg-cyber-panel shadow-2xl overflow-hidden">
        {/* Header gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-cyber-blue via-purple-500 to-cyber-red" />

        <div className="p-8">
          {/* Close */}
          <button
            onClick={onBack}
            className="absolute top-4 right-4 rounded-full p-1.5 text-cyber-muted hover:text-cyber-red transition"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyber-blue/20 to-purple-500/20 border border-cyber-border">
              <Sword className="h-6 w-6 text-cyber-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyber-text">Duel Mode</h2>
              <p className="text-xs text-cyber-muted">Attack vs Defense — Real-Time Battle</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-cyber-red/30 bg-cyber-red/10 px-4 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Initial choice */}
          {!mode && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('create')}
                className="group flex flex-col items-center gap-3 rounded-xl border border-cyber-border bg-cyber-panelSoft p-6 hover:border-cyber-blue transition"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyber-blue/10 border border-cyber-blue/30 group-hover:bg-cyber-blue/20 transition">
                  <Wifi className="h-7 w-7 text-cyber-blue" />
                </div>
                <span className="text-sm font-bold text-cyber-text">Create Room</span>
                <span className="text-xs text-cyber-muted text-center">Host a new duel and share your code</span>
              </button>

              <button
                onClick={() => setMode('join')}
                className="group flex flex-col items-center gap-3 rounded-xl border border-cyber-border bg-cyber-panelSoft p-6 hover:border-purple-500 transition"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/30 group-hover:bg-purple-500/20 transition">
                  <Users className="h-7 w-7 text-purple-400" />
                </div>
                <span className="text-sm font-bold text-cyber-text">Join Room</span>
                <span className="text-xs text-cyber-muted text-center">Enter a room code to join as defender</span>
              </button>
            </div>
          )}

          {/* Create room: scenario select */}
          {mode === 'create' && (
            <div className="space-y-5">
              <p className="text-sm font-semibold text-cyber-muted uppercase tracking-wide">Select Scenario</p>
              <div className="grid grid-cols-2 gap-2">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScenarioId(s.id)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-semibold text-left transition ${
                      scenarioId === s.id
                        ? 'border-cyber-blue bg-cyber-blue/10 text-cyber-blue'
                        : 'border-cyber-border bg-cyber-panelSoft text-cyber-muted hover:border-cyber-blue/50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-cyber-blue to-blue-600 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading ? 'Creating…' : 'Create Room'}
              </button>

              <button onClick={() => setMode(null)} className="w-full text-xs text-cyber-muted hover:text-cyber-text transition">
                ← Back
              </button>
            </div>
          )}

          {/* Created: show room code */}
          {mode === 'created' && roomCode && (
            <div className="space-y-5 text-center">
              <p className="text-sm text-cyber-muted">Share this code with your opponent:</p>

              <div className="relative mx-auto w-fit">
                <div className="rounded-2xl border-2 border-cyber-blue/40 bg-gradient-to-br from-cyber-blue/10 to-purple-500/10 px-10 py-6">
                  <span className="font-mono text-5xl font-black tracking-[0.3em] text-cyber-blue">
                    {roomCode}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg border border-cyber-border bg-cyber-panelSoft px-4 py-2 text-xs font-semibold text-cyber-text hover:border-cyber-blue transition"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied!' : 'Copy Code'}
              </button>

              <p className="text-xs text-cyber-muted">
                You will join as <span className="text-cyber-red font-semibold">Attacker</span>.
                Your opponent joins as <span className="text-cyber-green font-semibold">Defender</span>.
              </p>

              <button
                onClick={handleEnterAsHost}
                className="w-full rounded-xl bg-gradient-to-r from-cyber-red to-red-700 py-3 text-sm font-bold text-white hover:opacity-90 transition"
              >
                ⚔ Enter Arena as Attacker
              </button>
            </div>
          )}

          {/* Join room: enter code */}
          {mode === 'join' && (
            <div className="space-y-5">
              <p className="text-sm font-semibold text-cyber-muted uppercase tracking-wide">Enter Room Code</p>

              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="AB1C2D"
                className="w-full rounded-xl border border-cyber-border bg-cyber-background px-4 py-3 text-center font-mono text-3xl font-black tracking-[0.3em] text-cyber-text placeholder:text-cyber-muted/40 focus:border-purple-500 focus:outline-none"
              />

              <button
                onClick={handleJoin}
                disabled={loading || joinCode.trim().length !== 6}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading ? 'Joining…' : '🛡 Join as Defender'}
              </button>

              <button onClick={() => setMode(null)} className="w-full text-xs text-cyber-muted hover:text-cyber-text transition">
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
