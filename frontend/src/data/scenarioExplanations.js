export const scenarioExplanations = {
  'bank-mitm': {
    title: 'Bank Transaction Interception',
    concept: 'Man-in-the-Middle attack with AES-256-GCM defense',
    attackSummary: 'The attacker positions a relay between the client and bank gateway, then tries to read the transaction payload while it is moving through the network.',
    defenseSummary: 'AES-256-GCM encrypts the transaction before transit, so the attacker can still capture traffic but cannot understand or modify the protected payload.',
    attackSteps: [
      'Client prepares a bank transaction request.',
      'Attacker relay intercepts the request route.',
      'Plaintext mode exposes account, merchant, amount, and nonce details.',
      'Captured data can be copied into attacker logs.',
    ],
    defenseSteps: [
      'AES-256-GCM creates a random nonce and encrypts the payload.',
      'Only ciphertext is visible during interception.',
      'Authentication tag protects against payload tampering.',
      'Gateway receives a verified encrypted request.',
    ],
    takeaway: 'Encryption does not always stop interception, but it prevents the attacker from reading useful information.',
  },
  'password-bruteforce': {
    title: 'Password Brute Force',
    concept: 'Credential guessing with password hashing, lockout, and rate-control defense',
    attackSummary: 'The attacker tries candidate passwords one by one until the correct credential is found.',
    defenseSummary: 'Password hashes are checked safely, and account lockout stops repeated attempts before the correct password is reached.',
    attackSteps: [
      'Attacker loads a small dictionary of candidate passwords.',
      'Each candidate is submitted to the authentication server.',
      'Without lockout, the correct password can eventually match.',
      'Successful match compromises the account.',
    ],
    defenseSteps: [
      'Failed login counter starts tracking attempts.',
      'Password checks use PBKDF2-SHA256 hashes instead of plain text storage.',
      'Account lockout triggers after repeated failed attempts.',
      'Correct password is never reached by the attacker.',
    ],
    takeaway: 'Password hashing protects stored passwords, while lockout and rate limiting reduce brute-force success.',
  },
  'packet-sniffing': {
    title: 'Packet Sniffing',
    concept: 'Packet capture with encrypted transport defense',
    attackSummary: 'The attacker monitors a shared network segment and captures traffic moving between client and servers.',
    defenseSummary: 'Encrypted transport protects packet contents, so the sniffer only sees metadata and ciphertext.',
    attackSteps: [
      'Sniffer attaches to a monitored network segment.',
      'HTTP, FTP, or API traffic is captured.',
      'Plaintext mode exposes emails, file metadata, and demo bearer tokens.',
      'Captured packets become useful attacker intelligence.',
    ],
    defenseSteps: [
      'Traffic is protected using encrypted transport behavior.',
      'Payloads are transformed into ciphertext before capture.',
      'Sensitive tokens are no longer visible in packet previews.',
      'Defender classifies captured flows as encrypted traffic.',
    ],
    takeaway: 'Packet sniffing is dangerous mainly when traffic is unencrypted; encrypted transport keeps captured packets unreadable.',
  },
  'replay-attack': {
    title: 'Replay Attack',
    concept: 'Captured request reuse with nonce and session validation defense',
    attackSummary: 'The attacker captures a valid payment request and sends the exact same request again.',
    defenseSummary: 'A nonce and request fingerprint identify duplicate requests, causing the gateway to reject the replay.',
    attackSteps: [
      'Client sends a valid payment request.',
      'Attacker captures and stores the request.',
      'The captured packet is retransmitted later.',
      'Without nonce protection, the duplicate request is accepted.',
    ],
    defenseSteps: [
      'Gateway stores a fingerprint of the original request.',
      'Nonce ledger records that the nonce has already been used.',
      'Replay attempt repeats the same nonce/session information.',
      'Gateway rejects the duplicate before payment execution.',
    ],
    takeaway: 'Freshness controls such as nonces, timestamps, and session binding prevent valid old packets from being reused.',
  },
}

export function getScenarioExplanation(scenarioId) {
  return scenarioExplanations[scenarioId] ?? scenarioExplanations['bank-mitm']
}
