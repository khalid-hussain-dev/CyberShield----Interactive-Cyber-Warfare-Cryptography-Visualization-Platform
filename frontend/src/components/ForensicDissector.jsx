import { AlertTriangle, Terminal } from 'lucide-react'

export default function ForensicDissector({ packets = [], launched }) {
  if (!launched || packets.length === 0) {
    return (
      <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-lg border border-cyber-border bg-cyber-panelSoft p-4 text-center text-cyber-muted">
        <Terminal className="h-7 w-7 text-cyber-blue/50" />
        <p className="text-xs">PCAP Forensics standby. Launch the Packet Sniffing scenario to begin dissecting packet frames.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
      {packets.map((pkt) => {
        const isLowEntropy = pkt.entropy_score < 3.5
        const isHighEntropy = pkt.entropy_score > 6.0
        const barColor = isLowEntropy ? 'bg-cyber-red' : isHighEntropy ? 'bg-cyber-green' : 'bg-cyber-yellow'
        const entropyPct = Math.min(100, Math.max(10, (pkt.entropy_score / 8.0) * 100))
        const entropyLabel = pkt.entropy_label || (isLowEntropy ? 'Plaintext' : isHighEntropy ? 'Encrypted' : 'Mixed')

        return (
          <div key={pkt.id} className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-3 text-xs space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyber-blue uppercase text-[10px]">{pkt.protocol} · {pkt.id}</span>
                <span className="text-cyber-muted text-[9px]">{pkt.time}</span>
              </div>
              <div className="font-mono text-cyber-text text-[10px] truncate">
                {pkt.source}:{pkt.src_port || '—'} → {pkt.target}:{pkt.dst_port || '—'}
              </div>
              <div className="flex justify-between text-[9px] text-cyber-muted font-mono bg-black/20 px-1.5 py-0.5 rounded">
                <span>TTL: {pkt.ttl}</span>
                <span>Flags: {pkt.tcp_flags}</span>
                <span>Size: {pkt.packet_size}B</span>
              </div>
              <div className="rounded border border-cyber-border/40 bg-black/40 p-1.5 font-mono text-[9px] text-cyber-text break-all whitespace-pre-wrap max-h-16 overflow-y-auto">
                {pkt.payload_preview}
              </div>
            </div>
            {pkt.entropy_score !== undefined && (
              <div className="space-y-1 pt-1 border-t border-cyber-border/40">
                <div className="flex items-center justify-between text-[9px] text-cyber-muted font-mono">
                  <span>Shannon Entropy: {pkt.entropy_score}</span>
                  <span className={`font-semibold ${isLowEntropy ? 'text-cyber-red' : isHighEntropy ? 'text-cyber-green' : 'text-cyber-yellow'}`}>
                    {entropyLabel}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-cyber-border overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${entropyPct}%` }} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
