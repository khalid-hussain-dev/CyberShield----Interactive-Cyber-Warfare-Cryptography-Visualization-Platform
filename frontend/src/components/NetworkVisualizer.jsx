/**
 * NetworkVisualizer.jsx — Cinematic Packet Interception Animation
 *
 * Animation narrative (5-second cycle, RAF-driven for precise timing):
 *
 * ─── NO DEFENSE (attack active) ─────────────────────────────────────────────
 *   t=0.00  Main packet (green) leaves Client heading toward Server
 *   t=0.00  Incoming red signal rises from below toward Attacker
 *   t=0.38  Incoming signal absorbed by Attacker (opacity fades)
 *   t=0.32  Attack shot fires upward from Attacker
 *   t=0.44  Attack shot reaches the communication channel (top=28%)
 *           → Main packet TURNS RED at this moment (intercepted)
 *   t=0.90  Red packet arrives at Server (compromised)
 *   t=0.95  Cycle resets
 *
 * ─── WITH DEFENSE ────────────────────────────────────────────────────────────
 *   t=0.00  Main packet (green) leaves Client
 *   t=0.32  Attack shot fires from Attacker (red)
 *   t=0.44  Attack shot reaches y≈38% — BLOCKED — begins bouncing back
 *   t=0.56  Attack shot disappears back at Attacker
 *   t=0.90  Green packet safely arrives at Server
 *   t=0.95  Cycle resets
 */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Banknote, KeyRound, Laptop, RadioTower, Server, ShieldAlert, ShieldCheck, User } from 'lucide-react'
import StatusPill from './StatusPill'

// ── Animation constants ───────────────────────────────────────────────────────
const CYCLE = 5.2       // seconds per full animation cycle
const INTERCEPT_AT = 0.44  // phase at which interception happens (main packet ~at x=52%)

// ── Math helpers ──────────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const invlerp = (a, b, v) => clamp01((v - a) / (b - a))
const smoothstep = (t) => { const c = clamp01(t); return c * c * (3 - 2 * c) }
const easeIn = (t) => t * t
const easeOut = (t) => 1 - (1 - t) * (1 - t)

// ── RAF-based phase hook (0 → 1 over CYCLE seconds) ──────────────────────────
function usePhase(launched) {
  const [t, setT] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (!launched) {
      setT(0)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    startRef.current = performance.now()

    const tick = (now) => {
      const elapsed = (now - startRef.current) / 1000
      setT((elapsed % CYCLE) / CYCLE)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [launched])

  return t
}

// ── Node card ─────────────────────────────────────────────────────────────────
function Node({ icon: Icon, label, meta, className, tone = 'blue' }) {
  const toneClass =
    tone === 'red'   ? 'text-cyber-red'   :
    tone === 'green' ? 'text-cyber-green' :
                       'text-cyber-blue'

  return (
    <div className={`absolute w-32 rounded-lg border border-cyber-border bg-cyber-panelSoft p-3 ${className} shadow-lg select-none z-10`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${toneClass}`} aria-hidden="true" />
        <span className="truncate text-sm font-semibold text-cyber-text">{label}</span>
      </div>
      <p className="mt-2 truncate text-xs text-cyber-muted">{meta}</p>
    </div>
  )
}

// ── Scenario profiles ─────────────────────────────────────────────────────────
function getVisualizationProfile(scenario, defenseEnabled) {
  const id = scenario?.id

  if (id === 'password-bruteforce') {
    return {
      routeColor: '#EF4444',
      nodes: [
        { icon: User,        label: 'Operator',    meta: 'student_operator',    className: 'left-[6%] top-[16%]',             tone: 'blue' },
        { icon: Server,      label: 'Auth Server', meta: 'Password hash check', className: 'right-[7%] top-[16%]',            tone: defenseEnabled ? 'green' : 'yellow' },
        { icon: KeyRound,    label: 'Attacker',    meta: 'Dictionary attempts', className: 'left-1/2 top-[42%] -translate-x-1/2', tone: 'red' },
        { icon: ShieldAlert, label: 'Lockout',     meta: 'Defense policy',      className: 'right-[7%] top-[54%]',            tone: 'green' },
      ],
      interceptMsg: 'Credential brute-force detected!',
      blockedMsg:   'Account locked — brute force blocked',
      protectedMsg: 'Login protected by lockout policy',
      attackPath:   'Attacker → Auth Server: trying 10,000 passwords/sec',
    }
  }

  if (id === 'packet-sniffing') {
    return {
      routeColor: '#3B82F6',
      nodes: [
        { icon: Laptop,      label: 'Client',     meta: 'Mail/file/API traffic',  className: 'left-[6%] top-[16%]',             tone: 'blue' },
        { icon: Server,      label: 'Switch',     meta: 'Shared segment',          className: 'right-[7%] top-[16%]',            tone: defenseEnabled ? 'green' : 'yellow' },
        { icon: RadioTower,  label: 'Sniffer',    meta: 'Packet capture',          className: 'left-1/2 top-[42%] -translate-x-1/2', tone: 'red' },
        { icon: ShieldCheck, label: 'TLS Policy', meta: 'Payload protection',      className: 'right-[7%] top-[54%]',            tone: 'green' },
      ],
      interceptMsg: 'Packet captured — payload exposed!',
      blockedMsg:   'Encrypted — sniffer sees gibberish',
      protectedMsg: 'Traffic encrypted with TLS 1.3',
      attackPath:   'Sniffer reads all plaintext data on shared network',
    }
  }

  if (id === 'replay-attack') {
    return {
      routeColor: '#F59E0B',
      nodes: [
        { icon: Laptop,      label: 'Client',          meta: 'Original request',      className: 'left-[6%] top-[16%]',             tone: 'blue' },
        { icon: Server,      label: 'Payment Gateway', meta: 'Transaction execution',  className: 'right-[7%] top-[16%]',            tone: defenseEnabled ? 'green' : 'yellow' },
        { icon: RadioTower,  label: 'Replay Buffer',   meta: 'Captured request',       className: 'left-1/2 top-[42%] -translate-x-1/2', tone: 'red' },
        { icon: ShieldAlert, label: 'Nonce Ledger',    meta: 'Duplicate detection',    className: 'right-[7%] top-[54%]',            tone: 'green' },
      ],
      interceptMsg: 'Stolen token re-sent — transaction replayed!',
      blockedMsg:   'Nonce expired — replay rejected',
      protectedMsg: 'One-time token enforced',
      attackPath:   'Attacker re-sends captured auth token to trigger duplicate transaction',
    }
  }

  // Default: bank-mitm
  return {
    routeColor: '#22C55E',
    nodes: [
      { icon: Laptop,      label: 'Client',    meta: 'Transaction request', className: 'left-[6%] top-[16%]',             tone: 'blue' },
      { icon: Server,      label: 'Gateway',   meta: 'Packet relay',        className: 'right-[7%] top-[16%]',            tone: defenseEnabled ? 'green' : 'yellow' },
      { icon: RadioTower,  label: 'Attacker',  meta: 'Intercept node',      className: 'left-1/2 top-[42%] -translate-x-1/2', tone: 'red' },
      { icon: Banknote,    label: 'Bank API',  meta: 'Settlement service',  className: 'right-[7%] top-[54%]',            tone: 'green' },
    ],
    interceptMsg: 'Man-in-the-Middle intercept — data exposed!',
    blockedMsg:   'TLS handshake failed — attacker cannot decrypt',
    protectedMsg: 'End-to-end encryption active',
    attackPath:   'Attacker intercepts all traffic between Client ↔ Bank Gateway',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function NetworkVisualizer({ defenseEnabled, launched, packets = [], scenario, channel }) {
  // RAF phase (0→1 per CYCLE)
  const t = usePhase(launched)

  const interceptedPacket = packets.find((p) => p.intercepted)
  const profile = getVisualizationProfile(scenario, defenseEnabled)

  const channelLabel  = channel?.label   ?? (defenseEnabled ? profile.protectedMsg : profile.interceptMsg)
  const channelStatus = channel?.status  ?? (defenseEnabled ? 'Protected'          : 'Exposed')
  const channelDetail = interceptedPacket?.payload_preview ?? channel?.algorithm ??
                        (defenseEnabled ? profile.blockedMsg : profile.attackPath)
  const statusTone = ['protected','locked','monitoring','rejected','standby']
    .includes(channelStatus?.toLowerCase()) ? 'green' : 'red'

  // ── 1. MAIN PACKET (Client → Server, horizontal at y=28%) ─────────────────
  // Timeline: fade-in t∈[0.00,0.06], travel t∈[0.06,0.88], fade-out t∈[0.88,0.95]
  const mainFadeIn  = invlerp(0.00, 0.06, t)
  const mainTravel  = invlerp(0.06, 0.88, t)
  const mainFadeOut = 1 - invlerp(0.88, 0.95, t)
  const mainOpacity = Math.min(mainFadeIn, mainFadeOut)
  const mainLeft    = lerp(20, 80, easeIn(mainTravel * 0.4) + mainTravel * 0.6)  // slight ease-in then linear

  // Color flip: green → red at INTERCEPT_AT (only when no defense)
  const mainIntercepted  = !defenseEnabled && t >= INTERCEPT_AT
  const mainColor        = mainIntercepted ? '#EF4444' : '#22C55E'
  const mainGlow         = mainIntercepted
    ? '0 0 18px 4px rgba(239,68,68,0.95), 0 0 5px rgba(239,68,68,1)'
    : '0 0 18px 4px rgba(34,197,94,0.95),  0 0 5px rgba(34,197,94,1)'

  // ── 2. INCOMING SIGNAL → ATTACKER: removed per user request ─────────────
  // Attack packet now only emits FROM the Attacker (Packet 3 below)

  // ── 3. ATTACK SHOT (Attacker → channel / bounce back on defense) ───────────
  // Fires at t=0.32, reaches y=28% at t=0.44 (no defense) or deflects at y=38% with defense
  const SHOT_FIRE   = 0.32
  const SHOT_HIT    = 0.44   // reaches the channel line (y=28%) — or deflect point with defense
  const SHOT_VANISH_ATTACK  = 0.52   // disappears after hitting
  const SHOT_BOUNCE_PEAK    = 0.44   // turns around at this point with defense
  const SHOT_VANISH_DEFENSE = 0.58   // bounced shot disappears

  let shotLeft = 50, shotTop = 48, shotOpacity = 0

  if (t >= SHOT_FIRE) {
    if (!defenseEnabled && t <= SHOT_VANISH_ATTACK) {
      // ── No defense: shot travels straight up to the channel ───────────────
      if (t <= SHOT_HIT) {
        // Approaching
        const st = smoothstep(invlerp(SHOT_FIRE, SHOT_HIT, t))
        shotTop     = lerp(48, 28, st)
        shotLeft    = lerp(50, 50, st)  // straight vertical
        shotOpacity = invlerp(SHOT_FIRE, SHOT_FIRE + 0.04, t)
      } else {
        // Hit — lingers briefly at channel then vanishes
        shotTop     = 28
        shotLeft    = 50
        shotOpacity = 1 - invlerp(SHOT_HIT, SHOT_VANISH_ATTACK, t)
      }
    } else if (defenseEnabled && t <= SHOT_VANISH_DEFENSE) {
      // ── Defense: shot rises but gets deflected back ────────────────────────
      if (t <= SHOT_BOUNCE_PEAK) {
        // Rising (only goes to y=38% — blocked 10% above midpoint)
        const st = smoothstep(invlerp(SHOT_FIRE, SHOT_BOUNCE_PEAK, t))
        shotTop     = lerp(48, 38, st)
        shotLeft    = lerp(50, 51, st)  // slight rightward drift (deflection)
        shotOpacity = invlerp(SHOT_FIRE, SHOT_FIRE + 0.04, t)
      } else {
        // Bouncing back down — accelerates outward
        const st = smoothstep(invlerp(SHOT_BOUNCE_PEAK, SHOT_VANISH_DEFENSE, t))
        shotTop     = lerp(38, 58, easeIn(st))  // overshoots slightly below attacker
        shotLeft    = lerp(51, 48, st)           // drifts back
        shotOpacity = 1 - st
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── VISUAL CANVAS ─────────────────────────────────────────────────── */}
      <div className="relative min-h-[380px] overflow-hidden rounded-xl border border-cyber-border bg-[#0A0F1E] shadow-inner">

        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* SVG topology lines */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none" role="presentation" aria-hidden="true">
          {/* Main channel line: Client → Server (the communication highway) */}
          <line x1="20%" y1="28%" x2="80%" y2="28%"
            stroke={launched && !defenseEnabled && t >= INTERCEPT_AT ? '#EF444440' : '#22C55E30'}
            strokeWidth="1" strokeDasharray="5 5" />
          {/* Attacker topology connections */}
          <line x1="20%" y1="28%" x2="50%" y2="48%" stroke="#24324A" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="50%" y1="48%" x2="80%" y2="28%" stroke="#24324A" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="50%" y1="48%" x2="80%" y2="66%" stroke={profile.routeColor} strokeWidth="2" strokeDasharray="6 8" />

          {/* Attack vector line: Attacker → channel (animated color) */}
          {launched && (
            <line
              x1="50%" y1="48%" x2="50%" y2="28%"
              stroke={defenseEnabled ? '#EF444420' : '#EF444435'}
              strokeWidth="1" strokeDasharray="4 6"
            />
          )}
        </svg>

        {/* ── Network nodes ────────────────────────────────────────────────── */}
        {profile.nodes.map((node) => (
          <Node key={node.label} {...node} />
        ))}

        {/* ── PACKET 1: Main communication (Client → Server) ───────────────── */}
        {launched && (
          <div
            aria-hidden="true"
            style={{
              position:        'absolute',
              left:            `${mainLeft}%`,
              top:             '28%',
              width:           '14px',
              height:          '14px',
              borderRadius:    '50%',
              transform:       'translate(-50%, -50%)',
              pointerEvents:   'none',
              zIndex:          20,
              opacity:         mainOpacity,
              backgroundColor: mainColor,
              boxShadow:       mainGlow,
              transition:      'background-color 0.20s ease, box-shadow 0.20s ease',
            }}
          />
        )}

        {/* ── PACKET 2: Removed — attack now clearly emits FROM the Attacker (Packet 3) ── */}

        {/* ── PACKET 3: Attack shot (Attacker → channel / bounce) ─────────── */}
        {launched && shotOpacity > 0.01 && (
          <div
            aria-hidden="true"
            style={{
              position:        'absolute',
              left:            `${shotLeft}%`,
              top:             `${shotTop}%`,
              width:           '11px',
              height:          '11px',
              borderRadius:    '50%',
              transform:       'translate(-50%, -50%)',
              pointerEvents:   'none',
              zIndex:          21,
              opacity:         shotOpacity,
              backgroundColor: '#EF4444',
              boxShadow:       '0 0 14px 4px rgba(239,68,68,0.95)',
            }}
          />
        )}

        {/* ── Legend (bottom-left of canvas) ──────────────────────────────── */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1 pointer-events-none select-none z-30">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
            <span className="text-[10px] text-cyber-muted">Safe packet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#EF4444] shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
            <span className="text-[10px] text-cyber-muted">
              {defenseEnabled ? 'Blocked shot' : 'Intercepted packet'}
            </span>
          </div>
        </div>

        {/* ── Attacker pulse ring (shows active interception attempt) ─────── */}
        {launched && !defenseEnabled && (
          <motion.div
            className="absolute rounded-full border border-red-500/30 pointer-events-none z-10"
            style={{ left: 'calc(50% - 68px)', top: 'calc(42% - 12px)', width: '136px', height: '80px' }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* ── INTERCEPTED PAYLOAD CARD ────────────────────────────────────── */}
      {interceptedPacket && !defenseEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2.5 font-sans"
        >
          <p className="text-[10px] font-bold uppercase text-red-400 mb-1">Intercepted Payload</p>
          <p className="font-mono text-xs text-red-300 break-all leading-relaxed">
            {interceptedPacket.payload_preview}
          </p>
        </motion.div>
      )}

      {/* ── STATUS BAR ──────────────────────────────────────────────────── */}
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 backdrop-blur transition-all duration-300 ${
        !launched
          ? 'border-cyber-border bg-cyber-panel/40'
          : defenseEnabled
            ? 'border-green-500/35 bg-green-950/20 shadow-[0_0_15px_rgba(34,197,94,0.12)]'
            : 'border-red-500/35 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.12)]'
      }`}>
        <div className="flex items-center gap-3 font-sans">
          {defenseEnabled
            ? <ShieldCheck className="h-5 w-5 text-green-400 shrink-0" />
            : <ShieldAlert className={`h-5 w-5 shrink-0 ${launched ? 'text-red-400 animate-pulse' : 'text-cyber-muted'}`} />
          }
          <div className="min-w-0">
            <p className="text-sm font-bold text-cyber-text">{channelLabel}</p>
            <p className="text-xs text-cyber-muted truncate max-w-sm mt-0.5">{channelDetail}</p>
          </div>
        </div>
        <StatusPill tone={statusTone}>{channelStatus}</StatusPill>
      </div>
    </div>
  )
}
