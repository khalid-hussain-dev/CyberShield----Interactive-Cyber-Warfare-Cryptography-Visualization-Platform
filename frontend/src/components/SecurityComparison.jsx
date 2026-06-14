import { AlertTriangle, ArrowRightLeft, CheckCircle2, FileWarning, ShieldCheck } from 'lucide-react'
import StatusPill from './StatusPill'

const severityRank = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
}

const severityScore = {
  Critical: 22,
  High: 14,
  Medium: 8,
  Low: 3,
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function formatValue(value, fallback = 'N/A') {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  return String(value)
}

function getMetric(state, label) {
  return state?.metrics?.find((metric) => metric.label === label) ?? null
}

function getMetricValue(state, label) {
  return getMetric(state, label)?.value ?? 'N/A'
}

function getMetricTrend(state, label) {
  return getMetric(state, label)?.trend ?? 'not reported'
}

function getMetricLabels(insecure, secure) {
  return Array.from(new Set([...(insecure?.metrics ?? []), ...(secure?.metrics ?? [])].map((metric) => metric.label)))
}

function payloadPreview(state) {
  const packet = state?.packets?.find((item) => item.intercepted) ?? state?.packets?.[0]
  return packet?.payload_preview ?? 'No packet captured'
}

function readablePacketCount(state) {
  return state?.packets?.filter((packet) => packet.readable).length ?? 0
}

function interceptedPacketCount(state) {
  return state?.packets?.filter((packet) => packet.intercepted).length ?? 0
}

function highestAlert(state) {
  if (!state?.alerts?.length) {
    return null
  }

  return [...state.alerts].sort((left, right) => (severityRank[right.severity] ?? 0) - (severityRank[left.severity] ?? 0))[0]
}

function riskScore(state) {
  if (!state) {
    return 0
  }

  const highestSeverity = highestAlert(state)?.severity
  const base = state.attack_success ? 68 : 18
  const severity = severityScore[highestSeverity] ?? 0
  const readableExposure = state.attack_success ? readablePacketCount(state) * 3 : 0
  const defenseReduction = state.defense_enabled && !state.attack_success ? 8 : 0

  return clamp(base + severity + readableExposure - defenseReduction, 5, 100)
}

function riskTone(score) {
  if (score >= 65) {
    return 'red'
  }

  if (score >= 36) {
    return 'yellow'
  }

  return 'green'
}

function outcomeLabel(state) {
  if (!state) {
    return 'Unavailable'
  }

  return state.attack_success ? 'Attack Successful' : 'Attack Blocked'
}

function outcomeTone(state) {
  return state?.attack_success ? 'red' : 'green'
}

function statusText(state) {
  const channel = state?.channel
  if (!channel) {
    return 'Unavailable'
  }

  return `${formatValue(channel.label, 'Channel')} (${formatValue(channel.status, 'unknown')})`
}

function defenseStatusMap(state) {
  return new Map((state?.defenses ?? []).map((defense) => [defense.name, defense]))
}

function changedDefenses(insecure, secure) {
  const insecureMap = defenseStatusMap(insecure)
  const secureMap = defenseStatusMap(secure)
  const names = Array.from(new Set([...insecureMap.keys(), ...secureMap.keys()]))

  return names.map((name) => ({
    name,
    before: insecureMap.get(name)?.status ?? 'Not listed',
    after: secureMap.get(name)?.status ?? 'Not listed',
    tone: secureMap.get(name)?.tone ?? 'slate',
  }))
}

function packetRows(insecure, secure) {
  const maxRows = Math.max(insecure?.packets?.length ?? 0, secure?.packets?.length ?? 0)

  return Array.from({ length: maxRows }, (_, index) => ({
    id: insecure?.packets?.[index]?.id ?? secure?.packets?.[index]?.id ?? `packet-${index + 1}`,
    before: insecure?.packets?.[index] ?? null,
    after: secure?.packets?.[index] ?? null,
  }))
}

function lastLog(entries) {
  if (!entries?.length) {
    return 'No log entry available'
  }

  return entries[entries.length - 1]
}

function ComparisonSummaryCard({ title, state }) {
  const score = riskScore(state)
  const tone = riskTone(score)

  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-cyber-muted">{title}</p>
          <p className="mt-1 text-sm font-semibold text-cyber-text">{outcomeLabel(state)}</p>
        </div>
        {state?.attack_success ? (
          <FileWarning className="h-5 w-5 shrink-0 text-cyber-red" aria-hidden="true" />
        ) : (
          <ShieldCheck className="h-5 w-5 shrink-0 text-cyber-green" aria-hidden="true" />
        )}
      </div>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between gap-3 text-xs text-cyber-muted">
          <span>Risk Score</span>
          <span>{score}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-cyber-background">
          <div className={`h-full rounded-full ${tone === 'red' ? 'bg-cyber-red' : tone === 'yellow' ? 'bg-cyber-yellow' : 'bg-cyber-green'}`} style={{ width: `${score}%` }} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border border-cyber-border bg-cyber-background p-2">
          <p className="text-cyber-muted">Packets</p>
          <p className="mt-1 font-semibold text-cyber-text">{state?.packets?.length ?? 0}</p>
        </div>
        <div className="rounded-md border border-cyber-border bg-cyber-background p-2">
          <p className="text-cyber-muted">Readable</p>
          <p className="mt-1 font-semibold text-cyber-text">{readablePacketCount(state)}</p>
        </div>
      </div>
    </div>
  )
}

const securityMetrics = [
  { key: 'confidentiality', label: 'Confidentiality' },
  { key: 'integrity', label: 'Integrity' },
  { key: 'availability', label: 'Availability' },
  { key: 'authentication', label: 'Authentication' },
  { key: 'nonrepudiation', label: 'Non-repudiation' }
];

const profiles = {
  'bank-mitm': {
    insecure: { confidentiality: 10, integrity: 20, availability: 95, authentication: 10, nonrepudiation: 10 },
    secure: { confidentiality: 95, integrity: 95, availability: 95, authentication: 90, nonrepudiation: 80 }
  },
  'password-bruteforce': {
    insecure: { confidentiality: 15, integrity: 30, availability: 95, authentication: 10, nonrepudiation: 20 },
    secure: { confidentiality: 90, integrity: 90, availability: 70, authentication: 95, nonrepudiation: 80 }
  },
  'packet-sniffing': {
    insecure: { confidentiality: 10, integrity: 35, availability: 95, authentication: 20, nonrepudiation: 20 },
    secure: { confidentiality: 95, integrity: 90, availability: 95, authentication: 90, nonrepudiation: 80 }
  },
  'replay-attack': {
    insecure: { confidentiality: 40, integrity: 20, availability: 95, authentication: 25, nonrepudiation: 10 },
    secure: { confidentiality: 80, integrity: 95, availability: 95, authentication: 95, nonrepudiation: 95 }
  }
};

function SecurityRadarChart({ scenarioId }) {
  const cx = 160;
  const cy = 130;
  const r = 85;
  const scenarioProfile = profiles[scenarioId] ?? profiles['bank-mitm'];

  const getPoints = (profileData) => {
    return securityMetrics.map((metric, i) => {
      const val = profileData[metric.key] ?? 50;
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const x = cx + r * (val / 100) * Math.cos(angle);
      const y = cy + r * (val / 100) * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const pointsInsecure = getPoints(scenarioProfile.insecure);
  const pointsSecure = getPoints(scenarioProfile.secure);

  return (
    <div className="flex justify-center py-2 bg-cyber-background/30 rounded-lg border border-cyber-border/50">
      <svg width="320" height="250" className="overflow-visible select-none" role="presentation" aria-hidden="true">
        {/* Pentagon Grid scale lines */}
        {[0.25, 0.5, 0.75, 1.0].map((scale) => {
          const gridPoints = securityMetrics.map((_, i) => {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const x = cx + r * scale * Math.cos(angle);
            const y = cy + r * scale * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');
          return <polygon key={scale} points={gridPoints} fill="none" stroke="#24324A" strokeWidth="1" />
        })}

        {/* Central axis lines */}
        {securityMetrics.map((_, i) => {
          const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#24324A" strokeWidth="1" strokeDasharray="3 3" />
        })}

        {/* Insecure Polygon */}
        <polygon points={pointsInsecure} fill="#EF4444" fillOpacity="0.25" stroke="#EF4444" strokeWidth="1.5" />
        {/* Secure Polygon */}
        <polygon points={pointsSecure} fill="#22C55E" fillOpacity="0.25" stroke="#22C55E" strokeWidth="1.5" />

        {/* Label elements */}
        {securityMetrics.map((metric, i) => {
          const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
          const x = cx + (r + 14) * Math.cos(angle);
          const y = cy + (r + 10) * Math.sin(angle);
          let textAnchor = 'middle';
          if (Math.cos(angle) > 0.1) textAnchor = 'start';
          else if (Math.cos(angle) < -0.1) textAnchor = 'end';
          return (
            <text key={metric.key} x={x} y={y + 3} fill="#94A3B8" fontSize="9" textAnchor={textAnchor} className="font-semibold select-none font-sans">
              {metric.label}
            </text>
          )
        })}
      </svg>
    </div>
  );
}

function ThreatBarChart({ insecure, secure }) {
  const scoreBefore = riskScore(insecure);
  const scoreAfter = riskScore(secure);
  const packetsBefore = readablePacketCount(insecure);
  const packetsAfter = readablePacketCount(secure);

  return (
    <div className="space-y-4 py-2 font-sans text-xs">
      <div>
        <div className="mb-2 flex justify-between text-[10px] font-bold tracking-wider text-cyber-muted uppercase">
          <span>Risk Level comparison</span>
          <span>Insecure: {scoreBefore} | Secure: {scoreAfter}</span>
        </div>
        <div className="space-y-2">
          <div className="relative h-6 w-full rounded bg-cyber-background overflow-hidden border border-cyber-border">
            <div className="absolute left-2.5 top-1.5 z-10 text-[9px] font-bold text-red-200">WITHOUT DEFENSE</div>
            <div className="h-full bg-gradient-to-r from-red-800 to-cyber-red/80 transition-all duration-500" style={{ width: `${scoreBefore}%` }} />
          </div>
          <div className="relative h-6 w-full rounded bg-cyber-background overflow-hidden border border-cyber-border">
            <div className="absolute left-2.5 top-1.5 z-10 text-[9px] font-bold text-green-200">WITH DEFENSE</div>
            <div className="h-full bg-gradient-to-r from-green-800 to-cyber-green/80 transition-all duration-500" style={{ width: `${scoreAfter}%` }} />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-[10px] font-bold tracking-wider text-cyber-muted uppercase">
          <span>Plain Packet Leakage</span>
          <span>Insecure: {packetsBefore} | Secure: {packetsAfter}</span>
        </div>
        <div className="space-y-2">
          <div className="relative h-6 w-full rounded bg-cyber-background overflow-hidden border border-cyber-border">
            <div className="absolute left-2.5 top-1.5 z-10 text-[9px] font-bold text-red-200">EXPOSED PACKETS CAPTURED</div>
            <div className="h-full bg-cyber-red/30 transition-all duration-500" style={{ width: `${Math.min(100, (packetsBefore / 3) * 100)}%` }} />
          </div>
          <div className="relative h-6 w-full rounded bg-cyber-background overflow-hidden border border-cyber-border">
            <div className="absolute left-2.5 top-1.5 z-10 text-[9px] font-bold text-green-200">EXPOSED PACKETS CAPTURED</div>
            <div className="h-full bg-cyber-green/30 transition-all duration-500" style={{ width: `${Math.min(100, (packetsAfter / 3) * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ComparisonColumn({ title, state }) {
  const alert = highestAlert(state)

  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-cyber-text">{title}</p>
        <StatusPill tone={outcomeTone(state)}>{outcomeLabel(state)}</StatusPill>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-cyber-muted">Channel</p>
          <p className="mt-1 text-cyber-text">{statusText(state)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-cyber-muted">Protection</p>
          <p className="mt-1 text-cyber-text">{state?.channel?.algorithm ?? 'None'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-cyber-muted">Captured Preview</p>
          <p className="mt-1 max-h-16 overflow-hidden break-all font-mono text-xs leading-5 text-cyber-muted">{payloadPreview(state)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-semibold uppercase text-cyber-muted">Intercepted</p>
            <p className="mt-1 text-cyber-text">{interceptedPacketCount(state)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-cyber-muted">Top Alert</p>
            <p className="mt-1 text-cyber-text">{alert ? `${alert.severity}: ${alert.title}` : 'No alerts'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricComparison({ insecure, secure }) {
  const labels = getMetricLabels(insecure, secure)

  return (
    <div className="overflow-x-auto rounded-lg border border-cyber-border">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm">
        <thead className="bg-cyber-background text-xs uppercase text-cyber-muted">
          <tr>
            <th className="px-3 py-2 font-semibold">Metric</th>
            <th className="px-3 py-2 font-semibold">Without Defense</th>
            <th className="px-3 py-2 font-semibold">With Defense</th>
            <th className="px-3 py-2 font-semibold">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label) => (
            <tr key={label} className="border-t border-cyber-border">
              <td className="px-3 py-2 font-semibold text-cyber-text">{label}</td>
              <td className="px-3 py-2 text-cyber-muted">{getMetricValue(insecure, label)}</td>
              <td className="px-3 py-2 text-cyber-muted">{getMetricValue(secure, label)}</td>
              <td className="px-3 py-2 text-cyber-muted">{getMetricTrend(secure, label)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PacketComparison({ insecure, secure }) {
  const rows = packetRows(insecure, secure)

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-3 text-sm text-cyber-muted">
        No packet evidence is available for this comparison.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-cyber-border">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-cyber-background text-xs uppercase text-cyber-muted">
          <tr>
            <th className="px-3 py-2 font-semibold">Packet</th>
            <th className="px-3 py-2 font-semibold">Without Defense Evidence</th>
            <th className="px-3 py-2 font-semibold">With Defense Evidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-cyber-border align-top">
              <td className="px-3 py-2 font-mono text-xs text-cyber-muted">{row.id}</td>
              <td className="px-3 py-2">
                <p className="text-xs font-semibold text-cyber-text">{formatValue(row.before?.protocol)} / {formatValue(row.before?.status)}</p>
                <p className="mt-1 max-h-14 overflow-hidden break-all font-mono text-xs leading-5 text-cyber-muted">{formatValue(row.before?.payload_preview, 'No packet')}</p>
              </td>
              <td className="px-3 py-2">
                <p className="text-xs font-semibold text-cyber-text">{formatValue(row.after?.protocol)} / {formatValue(row.after?.status)}</p>
                <p className="mt-1 max-h-14 overflow-hidden break-all font-mono text-xs leading-5 text-cyber-muted">{formatValue(row.after?.payload_preview, 'No packet')}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DefenseChanges({ insecure, secure }) {
  const defenses = changedDefenses(insecure, secure)

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {defenses.map((defense) => (
        <div key={defense.name} className="rounded-md border border-cyber-border bg-cyber-panelSoft p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-semibold text-cyber-text">{defense.name}</p>
            <StatusPill tone={defense.tone}>{defense.after}</StatusPill>
          </div>
          <p className="mt-2 text-xs text-cyber-muted">Before: {defense.before}</p>
        </div>
      ))}
    </div>
  )
}

function EvidenceLogs({ insecure, secure }) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-3">
        <p className="text-xs font-semibold uppercase text-cyber-muted">Attacker Result</p>
        <p className="mt-2 font-mono text-xs leading-5 text-red-100">{lastLog(insecure?.attack_logs)}</p>
      </div>
      <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-3">
        <p className="text-xs font-semibold uppercase text-cyber-muted">Defender Result</p>
        <p className="mt-2 font-mono text-xs leading-5 text-green-100">{lastLog(secure?.defense_logs)}</p>
      </div>
    </div>
  )
}

function RiskReduction({ insecure, secure }) {
  const before = riskScore(insecure)
  const after = riskScore(secure)
  const reduction = clamp(before - after, 0, 100)

  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-3">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyber-green" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-cyber-text">Risk Reduced By {reduction} Points</p>
          <p className="mt-1 text-sm text-cyber-muted">
            The defended run changes the outcome from {outcomeLabel(insecure).toLowerCase()} to {outcomeLabel(secure).toLowerCase()}.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SecurityComparison({ comparison }) {
  if (comparison.status === 'loading') {
    return (
      <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-4 text-sm text-cyber-muted">
        Preparing secure and insecure comparison...
      </div>
    )
  }

  if (comparison.error) {
    return (
      <div className="rounded-lg border border-cyber-yellow/40 bg-cyber-yellow/10 p-4 text-sm text-yellow-100">
        {comparison.error}
      </div>
    )
  }

  if (!comparison.insecure || !comparison.secure) {
    return (
      <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-4 text-sm text-cyber-muted">
        Comparison data is not available yet.
      </div>
    )
  }

  const insecure = comparison.insecure
  const secure = comparison.secure

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-sm text-cyber-muted">
        <ArrowRightLeft className="mt-0.5 h-4 w-4 shrink-0 text-cyber-blue" aria-hidden="true" />
        <span>Compares the same scenario twice: first without defenses, then with protection enabled.</span>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <ComparisonSummaryCard title="Without Defense" state={insecure} />
        <ComparisonSummaryCard title="With Defense" state={secure} />
        <RiskReduction insecure={insecure} secure={secure} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-4">
          <p className="mb-3 text-sm font-semibold text-cyber-text">Security Profile Grid</p>
          <SecurityRadarChart scenarioId={insecure.scenario.id} />
        </div>
        <div className="rounded-lg border border-cyber-border bg-cyber-panelSoft p-4">
          <p className="mb-3 text-sm font-semibold text-cyber-text">Threat Metric Analysis</p>
          <ThreatBarChart insecure={insecure} secure={secure} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ComparisonColumn title="Without Defense" state={insecure} />
        <ComparisonColumn title="With Defense" state={secure} />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-cyber-yellow" aria-hidden="true" />
          <p className="text-sm font-semibold text-cyber-text">Metric Comparison</p>
        </div>
        <MetricComparison insecure={insecure} secure={secure} />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-cyber-text">Packet Evidence</p>
        <PacketComparison insecure={insecure} secure={secure} />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-cyber-text">Defense State Changes</p>
        <DefenseChanges insecure={insecure} secure={secure} />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-cyber-text">Final Evidence Logs</p>
        <EvidenceLogs insecure={insecure} secure={secure} />
      </div>
    </div>
  )
}
