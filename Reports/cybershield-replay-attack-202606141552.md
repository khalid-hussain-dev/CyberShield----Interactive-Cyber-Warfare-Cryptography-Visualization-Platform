# CyberShield Demo Report

Generated At: Jun 14, 2026, 03:52 PM
Generated For: Khalid Hussain
Scenario: Replay Attack
Scenario Type: Session Abuse
Target: Payment Gateway
Original Risk Rating: High

## 1. Scenario Purpose

Reuse a captured request and block it with nonce/session protection.

Concept Used: Captured request reuse with nonce and session validation defense

## 2. Current Dashboard State

| Field | Value |
| --- | --- |
| Launched | Yes |
| Defense Enabled | Yes |
| Attack Success | No |
| Channel Status | rejected |
| Channel Label | Replay Blocked |
| Defense Algorithm | Nonce/session replay detection |
| Highest Current Alert | High: Duplicate nonce rejected by gateway |

## 3. Explain Mode Summary

Attack Explanation:
The attacker captures a valid payment request and sends the exact same request again.

Defense Explanation:
A nonce and request fingerprint identify duplicate requests, causing the gateway to reject the replay.

Attack Flow:
- Client sends a valid payment request.
- Attacker captures and stores the request.
- The captured packet is retransmitted later.
- Without nonce protection, the duplicate request is accepted.

Defense Flow:
- Gateway stores a fingerprint of the original request.
- Nonce ledger records that the nonce has already been used.
- Replay attempt repeats the same nonce/session information.
- Gateway rejects the duplicate before payment execution.

Key Takeaway:
Freshness controls such as nonces, timestamps, and session binding prevent valid old packets from being reused.

## 4. Before Vs After Result

| Field | Without Defense | With Defense |
| --- | --- | --- |
| Outcome | Attack Successful | Attack Blocked |
| Risk Score | 99/100 | 24/100 |
| Risk Reduction | N/A | 75 points |
| Channel | Replay Accepted | Replay Blocked |
| Channel Status | replayed | rejected |
| Protection | None | Nonce/session replay detection |
| Packets Observed | 3 | 3 |
| Intercepted Packets | 2 | 2 |
| Readable Packets | 3 | 3 |
| Highest Alert | Critical: Duplicate payment request accepted | High: Duplicate nonce rejected by gateway |

Interpretation:
The unprotected run shows the attacker impact before controls are applied. The defended run shows the same scenario after cryptographic or network protection is enabled. In this scenario, the defense changes the result from attack successful to attack blocked.

## 5. Metric Evidence

| Metric | Current | Without Defense | With Defense | Defended Meaning |
| --- | --- | --- | --- | --- |
| Captured Requests | 01 | 01 | 01 | valid packet reused |
| Replay Attempts | 01 | 01 | 01 | duplicate request sent |
| Nonce Checks | 01 | 00 | 01 | duplicate nonce blocked |
| Alert Priority | P2 | P1 | P2 | replay rejected |

## 6. Packet Evidence

| Packet | Without Defense Status | Without Defense Payload | With Defense Status | With Defense Payload |
| --- | --- | --- | --- | --- |
| replay-001 | HTTPS / accepted | ORIGINAL transaction=PAY-884291 amount=2450 PKR nonce=nonce-20260527-884291 fingerprint=a13b94587a3d67884d | HTTPS / accepted | ORIGINAL transaction=PAY-884291 amount=2450 PKR nonce=nonce-20260527-884291 fingerprint=a13b94587a3d67884d |
| replay-002 | Packet Copy / captured | Captured valid request with nonce=nonce-20260527-884291 | Packet Copy / captured | Captured valid request with nonce=nonce-20260527-884291 |
| replay-003 | HTTPS / accepted | REPLAY transaction=PAY-884291 nonce=nonce-20260527-884291 fingerprint=a13b94587a3d67884d | HTTPS / rejected | REPLAY transaction=PAY-884291 nonce=nonce-20260527-884291 fingerprint=a13b94587a3d67884d |

Most Useful Captured Preview Without Defense:
Captured valid request with nonce=nonce-20260527-884291

Most Useful Captured Preview With Defense:
Captured valid request with nonce=nonce-20260527-884291

## 7. Alert Evidence

### Current Alerts

| Time | Severity | Title |
| --- | --- | --- |
| 12:18:16 | High | Duplicate nonce rejected by gateway |
| 12:18:12 | Medium | Replay buffer activity detected |
| 12:18:10 | Low | Original request fingerprint stored |

### Without Defense Alerts

| Time | Severity | Title |
| --- | --- | --- |
| 12:18:16 | Critical | Duplicate payment request accepted |
| 12:18:12 | High | Valid request copied to replay buffer |
| 12:18:10 | Medium | Reusable transaction packet observed |

### With Defense Alerts

| Time | Severity | Title |
| --- | --- | --- |
| 12:18:16 | High | Duplicate nonce rejected by gateway |
| 12:18:12 | Medium | Replay buffer activity detected |
| 12:18:10 | Low | Original request fingerprint stored |

## 8. Defense State Changes

| Defense Control | Without Defense | With Defense |
| --- | --- | --- |
| Nonce Protection | Inactive | Active |
| Session Binding | Inactive | Verified |
| Request Fingerprint | Skipped | Stored |
| Replay Monitor | Missed | Rejected |

## 9. Execution Logs

### Without Defense - Attacker Logs

```text
[12:18:10] Captured valid payment request from client session
[12:18:12] Stored packet copy with nonce=nonce-20260527-884291
[12:18:16] Replayed request fingerprint=a13b94587a3d67884dbc7c74
[12:18:17] Attack outcome: duplicate transaction accepted
```

### Without Defense - Defender Logs

```text
[12:18:10] Payment gateway accepted original request
[12:18:12] Nonce ledger inactive for this session
[12:18:16] Duplicate nonce was not checked
[12:18:17] Alert P1 raised for repeated transaction execution
```

### With Defense - Attacker Logs

```text
[12:18:10] Captured valid payment request from client session
[12:18:12] Stored packet copy with nonce=nonce-20260527-884291
[12:18:16] Replayed request fingerprint=a13b94587a3d67884dbc7c74
[12:18:17] Attack outcome: replay rejected by nonce/session validation
```

### With Defense - Defender Logs

```text
[12:18:10] Payment gateway accepted original request
[12:18:11] Stored request fingerprint=a13b94587a3d67884dbc7c74
[12:18:16] Duplicate nonce detected: nonce-20260527-884291
[12:18:17] Alert P2 raised; replay blocked before payment execution
```

## 10. Final Conclusion

CyberShield demonstrates the selected cyber attack in two controlled states. Without defense, the report records what the attacker can capture or exploit. With defense enabled, the report records how encryption, hashing, nonces, lockout, or traffic protection changes the result and reduces operational risk.
