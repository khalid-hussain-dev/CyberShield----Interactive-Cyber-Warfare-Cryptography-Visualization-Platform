export const scenarios = [
  {
    id: 'bank-mitm',
    name: 'Bank Transaction Interception',
    type: 'MITM',
    status: 'Active',
    risk: 'Critical',
    target: 'Bank API',
  },
  {
    id: 'password-bruteforce',
    name: 'Password Brute Force',
    type: 'Credential Attack',
    status: 'Queued',
    risk: 'High',
    target: 'Auth Server',
  },
  {
    id: 'packet-sniffing',
    name: 'Packet Sniffing',
    type: 'Capture',
    status: 'Ready',
    risk: 'Medium',
    target: 'Client Traffic',
  },
  {
    id: 'replay-attack',
    name: 'Replay Attack',
    type: 'Session Abuse',
    status: 'Ready',
    risk: 'High',
    target: 'Payment Gateway',
  },
]

export const baseMetrics = [
  { label: 'Active Attacks', value: '01', trend: '+ MITM trace', tone: 'red' },
  { label: 'Protected Channels', value: '03', trend: 'AES-256 ready', tone: 'green' },
  { label: 'Packets Observed', value: '184', trend: 'live simulation', tone: 'blue' },
  { label: 'Alert Priority', value: 'P1', trend: 'manual response', tone: 'yellow' },
]

export const attackLogs = [
  '[09:41:12] MITM relay initialized between client and bank-gateway',
  '[09:41:14] ARP spoof route accepted by vulnerable client',
  '[09:41:16] Plaintext payload captured: TXN:2450:ACCT-7721',
  '[09:41:18] Session token copied to replay buffer',
  '[09:41:21] Defense probe detected TLS upgrade attempt',
]

export const defenseLogs = [
  '[09:41:13] Defender console online',
  '[09:41:15] Packet entropy monitor armed',
  '[09:41:17] AES-256 channel policy available',
  '[09:41:19] Signature verification service standing by',
  '[09:41:22] Alert P1 raised for anomalous gateway route',
]

export const alerts = [
  { time: '09:41:22', title: 'Gateway route anomaly', severity: 'Critical' },
  { time: '09:41:18', title: 'Replay buffer activity', severity: 'High' },
  { time: '09:41:15', title: 'Unencrypted transfer detected', severity: 'Medium' },
]

export const defenses = [
  { name: 'AES-256 Encryption', status: 'Ready', tone: 'green' },
  { name: 'RSA Key Exchange', status: 'Ready', tone: 'blue' },
  { name: 'Digital Signatures', status: 'Standby', tone: 'yellow' },
  { name: 'Nonce Protection', status: 'Standby', tone: 'yellow' },
]
