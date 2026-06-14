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

function safeText(value, fallback = 'N/A') {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  return String(value)
}

function tableText(value) {
  return safeText(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function listText(entries, fallback = '- N/A') {
  if (!entries?.length) {
    return fallback
  }

  return entries.map((entry) => `- ${entry}`).join('\n')
}

function markdownTable(headers, rows) {
  if (!rows.length) {
    return 'No records available.'
  }

  return [
    `| ${headers.map(tableText).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(tableText).join(' | ')} |`),
  ].join('\n')
}

function getMetricMap(state) {
  return new Map((state?.metrics ?? []).map((metric) => [metric.label, metric]))
}

function metricLabels(insecure, secure, current) {
  return Array.from(new Set([...(insecure?.metrics ?? []), ...(secure?.metrics ?? []), ...(current?.metrics ?? [])].map((metric) => metric.label)))
}

function metricsTable(insecure, secure, current) {
  const insecureMetrics = getMetricMap(insecure)
  const secureMetrics = getMetricMap(secure)
  const currentMetrics = getMetricMap(current)

  return markdownTable(
    ['Metric', 'Current', 'Without Defense', 'With Defense', 'Defended Meaning'],
    metricLabels(insecure, secure, current).map((label) => [
      label,
      currentMetrics.get(label)?.value ?? 'N/A',
      insecureMetrics.get(label)?.value ?? 'N/A',
      secureMetrics.get(label)?.value ?? 'N/A',
      secureMetrics.get(label)?.trend ?? 'not reported',
    ]),
  )
}

function highestAlert(state) {
  if (!state?.alerts?.length) {
    return null
  }

  return [...state.alerts].sort((left, right) => (severityRank[right.severity] ?? 0) - (severityRank[left.severity] ?? 0))[0]
}

function readablePacketCount(state) {
  return state?.packets?.filter((packet) => packet.readable).length ?? 0
}

function interceptedPacketCount(state) {
  return state?.packets?.filter((packet) => packet.intercepted).length ?? 0
}

export function riskScore(state) {
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

function outcomeLabel(state) {
  if (!state) {
    return 'Unavailable'
  }

  return state.attack_success ? 'Attack Successful' : 'Attack Blocked'
}

function summarizePayload(state) {
  const packet = state?.packets?.find((item) => item.intercepted) ?? state?.packets?.[0]
  return packet?.payload_preview ?? 'No packet payload available'
}

function packetRows(insecure, secure) {
  const maxRows = Math.max(insecure?.packets?.length ?? 0, secure?.packets?.length ?? 0)

  return Array.from({ length: maxRows }, (_, index) => {
    const before = insecure?.packets?.[index]
    const after = secure?.packets?.[index]

    return [
      before?.id ?? after?.id ?? `packet-${index + 1}`,
      before ? `${before.protocol} / ${before.status}` : 'No packet',
      before?.payload_preview ?? 'No packet',
      after ? `${after.protocol} / ${after.status}` : 'No packet',
      after?.payload_preview ?? 'No packet',
    ]
  })
}

function alertRows(state) {
  return (state?.alerts ?? []).map((alert) => [alert.time, alert.severity, alert.title])
}

function defenseRows(insecure, secure) {
  const beforeMap = new Map((insecure?.defenses ?? []).map((defense) => [defense.name, defense.status]))
  const afterMap = new Map((secure?.defenses ?? []).map((defense) => [defense.name, defense.status]))
  const names = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()]))

  return names.map((name) => [name, beforeMap.get(name) ?? 'Not listed', afterMap.get(name) ?? 'Not listed'])
}

function logBlock(title, entries) {
  return `### ${title}

\`\`\`text
${entries?.length ? entries.join('\n') : 'No logs available'}
\`\`\``
}

function formatDate(date) {
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timestampForFilename(date) {
  const pad = (value) => String(value).padStart(2, '0')

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('')
}

export function buildReportFilename(scenarioId, date = new Date()) {
  return `cybershield-${scenarioId}-${timestampForFilename(date)}.md`
}

export function buildScenarioReport({ user, scenario, state, comparison, explanation, generatedAt = new Date() }) {
  const insecure = comparison?.insecure
  const secure = comparison?.secure
  const beforeScore = riskScore(insecure)
  const afterScore = riskScore(secure)
  const reduction = clamp(beforeScore - afterScore, 0, 100)
  const currentAlert = highestAlert(state)
  const insecureAlert = highestAlert(insecure)
  const secureAlert = highestAlert(secure)

  return `# CyberShield Demo Report

Generated At: ${formatDate(generatedAt)}
Generated For: ${user?.username ?? 'Operator'}
Scenario: ${scenario?.name ?? explanation.title}
Scenario Type: ${scenario?.type ?? 'N/A'}
Target: ${scenario?.target ?? 'N/A'}
Original Risk Rating: ${scenario?.risk ?? 'N/A'}

## 1. Scenario Purpose

${scenario?.description ?? explanation.attackSummary}

Concept Used: ${explanation.concept}

## 2. Current Dashboard State

| Field | Value |
| --- | --- |
| Launched | ${state?.launched ? 'Yes' : 'No'} |
| Defense Enabled | ${state?.defense_enabled ? 'Yes' : 'No'} |
| Attack Success | ${state?.attack_success ? 'Yes' : 'No'} |
| Channel Status | ${tableText(state?.channel?.status ?? 'Unknown')} |
| Channel Label | ${tableText(state?.channel?.label ?? 'Unknown')} |
| Defense Algorithm | ${tableText(state?.channel?.algorithm ?? 'None')} |
| Highest Current Alert | ${currentAlert ? `${currentAlert.severity}: ${tableText(currentAlert.title)}` : 'No active alerts'} |

## 3. Explain Mode Summary

Attack Explanation:
${explanation.attackSummary}

Defense Explanation:
${explanation.defenseSummary}

Attack Flow:
${listText(explanation.attackSteps)}

Defense Flow:
${listText(explanation.defenseSteps)}

Key Takeaway:
${explanation.takeaway}

## 4. Before Vs After Result

| Field | Without Defense | With Defense |
| --- | --- | --- |
| Outcome | ${outcomeLabel(insecure)} | ${outcomeLabel(secure)} |
| Risk Score | ${beforeScore}/100 | ${afterScore}/100 |
| Risk Reduction | N/A | ${reduction} points |
| Channel | ${tableText(insecure?.channel?.label ?? 'Unavailable')} | ${tableText(secure?.channel?.label ?? 'Unavailable')} |
| Channel Status | ${tableText(insecure?.channel?.status ?? 'Unavailable')} | ${tableText(secure?.channel?.status ?? 'Unavailable')} |
| Protection | ${tableText(insecure?.channel?.algorithm ?? 'None')} | ${tableText(secure?.channel?.algorithm ?? 'None')} |
| Packets Observed | ${insecure?.packets?.length ?? 0} | ${secure?.packets?.length ?? 0} |
| Intercepted Packets | ${interceptedPacketCount(insecure)} | ${interceptedPacketCount(secure)} |
| Readable Packets | ${readablePacketCount(insecure)} | ${readablePacketCount(secure)} |
| Highest Alert | ${insecureAlert ? `${insecureAlert.severity}: ${tableText(insecureAlert.title)}` : 'No alert'} | ${secureAlert ? `${secureAlert.severity}: ${tableText(secureAlert.title)}` : 'No alert'} |

Interpretation:
The unprotected run shows the attacker impact before controls are applied. The defended run shows the same scenario after cryptographic or network protection is enabled. In this scenario, the defense changes the result from ${outcomeLabel(insecure).toLowerCase()} to ${outcomeLabel(secure).toLowerCase()}.

## 5. Metric Evidence

${metricsTable(insecure, secure, state)}

## 6. Packet Evidence

${markdownTable(['Packet', 'Without Defense Status', 'Without Defense Payload', 'With Defense Status', 'With Defense Payload'], packetRows(insecure, secure))}

Most Useful Captured Preview Without Defense:
${summarizePayload(insecure)}

Most Useful Captured Preview With Defense:
${summarizePayload(secure)}

## 7. Alert Evidence

### Current Alerts

${markdownTable(['Time', 'Severity', 'Title'], alertRows(state))}

### Without Defense Alerts

${markdownTable(['Time', 'Severity', 'Title'], alertRows(insecure))}

### With Defense Alerts

${markdownTable(['Time', 'Severity', 'Title'], alertRows(secure))}

## 8. Defense State Changes

${markdownTable(['Defense Control', 'Without Defense', 'With Defense'], defenseRows(insecure, secure))}

## 9. Execution Logs

${logBlock('Without Defense - Attacker Logs', insecure?.attack_logs)}

${logBlock('Without Defense - Defender Logs', insecure?.defense_logs)}

${logBlock('With Defense - Attacker Logs', secure?.attack_logs)}

${logBlock('With Defense - Defender Logs', secure?.defense_logs)}

## 10. Final Conclusion

CyberShield demonstrates the selected cyber attack in two controlled states. Without defense, the report records what the attacker can capture or exploit. With defense enabled, the report records how encryption, hashing, nonces, lockout, or traffic protection changes the result and reduces operational risk.
`
}

export function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
