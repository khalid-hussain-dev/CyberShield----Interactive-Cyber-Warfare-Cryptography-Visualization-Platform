/**
 * NetworkVisualizer.jsx (Codex Animation + State-Themed Log Cards Integration)
 */
import { motion } from 'framer-motion'
import { Banknote, KeyRound, Laptop, RadioTower, Server, ShieldAlert, ShieldCheck, User } from 'lucide-react'
import StatusPill from './StatusPill'

const packetVariants = {
  plain: {
    backgroundColor: '#EF4444',
    boxShadow: '0 0 16px rgba(239, 68, 68, 0.85)',
  },
  encrypted: {
    backgroundColor: '#22C55E',
    boxShadow: '0 0 16px rgba(34, 197, 94, 0.85)',
  },
}

function Node({ icon: Icon, label, meta, className, tone = 'blue' }) {
  const toneClass = tone === 'red' ? 'text-cyber-red' : tone === 'green' ? 'text-cyber-green' : 'text-cyber-blue'

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

function Packet({ variant, launched, path }) {
  if (!launched) return null

  // Percentage-based coordinates mapped exactly to the node centers:
  // Client: (20%, 28%), Attacker: (50%, 48%), Gateway/Server: (80%, 28%), Lockout/Bank API: (80%, 66%)
  const animation = path === 'main'
    ? {
        left: ['20%', '50%', '80%'],
        top: ['28%', '48%', '28%'],
        opacity: [0, 1, 1, 0]
      }
    : {
        left: ['50%', '65%', '80%'],
        top: ['48%', '57%', '66%'],
        opacity: [0, 1, 1, 0]
      }

  return (
    <motion.div
      className="absolute h-3 w-3 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
      initial={{ left: path === 'main' ? '20%' : '50%', top: path === 'main' ? '28%' : '48%', opacity: 0 }}
      animate={animation}
      style={packetVariants[variant]}
      transition={{
        duration: path === 'main' ? 3.0 : 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: path === 'main' ? 0 : 0.8
      }}
    />
  )
}

function getVisualizationProfile(scenario, defenseEnabled) {
  const id = scenario?.id

  if (id === 'password-bruteforce') {
    return {
      routeColor: '#EF4444',
      nodes: [
        { icon: User, label: 'Operator', meta: 'student_operator', className: 'left-[6%] top-[16%]', tone: 'blue' },
        { icon: Server, label: 'Auth Server', meta: 'Password hash check', className: 'right-[7%] top-[16%]', tone: defenseEnabled ? 'green' : 'yellow' },
        { icon: KeyRound, label: 'Attacker', meta: 'Dictionary attempts', className: 'left-1/2 top-[42%] -translate-x-1/2', tone: 'red' },
        { icon: ShieldAlert, label: 'Lockout', meta: 'Defense policy', className: 'right-[7%] top-[54%]', tone: 'green' },
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
        { icon: Laptop, label: 'Client', meta: 'Mail/file/API traffic', className: 'left-[6%] top-[16%]', tone: 'blue' },
        { icon: Server, label: 'Switch', meta: 'Shared segment', className: 'right-[7%] top-[16%]', tone: defenseEnabled ? 'green' : 'yellow' },
        { icon: RadioTower, label: 'Sniffer', meta: 'Packet capture', className: 'left-1/2 top-[42%] -translate-x-1/2', tone: 'red' },
        { icon: ShieldCheck, label: 'TLS Policy', meta: 'Payload protection', className: 'right-[7%] top-[54%]', tone: 'green' },
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
        { icon: Laptop, label: 'Client', meta: 'Original request', className: 'left-[6%] top-[16%]', tone: 'blue' },
        { icon: Server, label: 'Payment Gateway', meta: 'Transaction execution', className: 'right-[7%] top-[16%]', tone: defenseEnabled ? 'green' : 'yellow' },
        { icon: RadioTower, label: 'Replay Buffer', meta: 'Captured request', className: 'left-1/2 top-[42%] -translate-x-1/2', tone: 'red' },
        { icon: ShieldAlert, label: 'Nonce Ledger', meta: 'Duplicate detection', className: 'right-[7%] top-[54%]', tone: 'green' },
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
      { icon: Laptop, label: 'Client', meta: 'Transaction request', className: 'left-[6%] top-[16%]', tone: 'blue' },
      { icon: Server, label: 'Gateway', meta: 'Packet relay', className: 'right-[7%] top-[16%]', tone: defenseEnabled ? 'green' : 'yellow' },
      { icon: RadioTower, label: 'Attacker', meta: 'Intercept node', className: 'left-1/2 top-[42%] -translate-x-1/2', tone: 'red' },
      { icon: Banknote, label: 'Bank API', meta: 'Settlement service', className: 'right-[7%] top-[54%]', tone: 'green' },
    ],
    interceptMsg: 'Man-in-the-Middle intercept — data exposed!',
    blockedMsg:   'TLS handshake failed — attacker cannot decrypt',
    protectedMsg: 'End-to-end encryption active',
    attackPath:   'Attacker intercepts all traffic between Client ↔ Bank Gateway',
  }
}

export default function NetworkVisualizer({ defenseEnabled, launched, packets = [], scenario, channel }) {
  const packetTone = defenseEnabled ? 'encrypted' : 'plain'
  const interceptedPacket = packets.find((packet) => packet.intercepted)
  const profile = getVisualizationProfile(scenario, defenseEnabled)

  const channelLabel = channel?.label ?? (defenseEnabled ? profile.protectedMsg : profile.interceptMsg)
  const channelStatus = channel?.status ?? (defenseEnabled ? 'Protected' : 'Exposed')
  const channelDetail = interceptedPacket?.payload_preview ?? channel?.algorithm ?? (defenseEnabled ? profile.blockedMsg : profile.attackPath)
  const statusTone = ['protected', 'locked', 'monitoring', 'rejected', 'standby'].includes(channelStatus?.toLowerCase()) ? 'green' : 'red'

  return (
    <div className="flex flex-col gap-4">
      {/* ── VISUAL CANVAS ── */}
      <div className="relative min-h-[380px] overflow-hidden rounded-xl border border-cyber-border bg-[#0A0F1E] shadow-inner">
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* SVG connection lines */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none" role="presentation" aria-hidden="true">
          <line x1="20%" y1="28%" x2="50%" y2="48%" stroke="#24324A" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="50%" y1="48%" x2="80%" y2="28%" stroke="#24324A" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="50%" y1="48%" x2="80%" y2="66%" stroke={profile.routeColor} strokeWidth="2" strokeDasharray="6 8" />
        </svg>

        {/* Nodes mapping */}
        {profile.nodes.map((node) => (
          <Node key={node.label} {...node} />
        ))}

        {/* Traveling packets */}
        <Packet variant={packetTone} launched={launched} path="main" />
        <Packet variant="plain" launched={launched} path="defense" />
      </div>

      {/* ── INTERCEPTED PAYLOAD CARD ── */}
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

      {/* ── STATUS BAR / LOG CARD ── */}
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
