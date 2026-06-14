# CyberShield Demo Report

Generated At: Jun 14, 2026, 03:27 PM
Generated For: Khalid Hussain
Scenario: Password Brute Force
Scenario Type: Credential Attack
Target: Auth Server
Original Risk Rating: High

## 1. Scenario Purpose

Demonstrate password guessing and account lock response.

Concept Used: Credential guessing with password hashing, lockout, and rate-control defense

## 2. Current Dashboard State

| Field | Value |
| --- | --- |
| Launched | Yes |
| Defense Enabled | Yes |
| Attack Success | No |
| Channel Status | locked |
| Channel Label | Account Lockout Active |
| Defense Algorithm | PBKDF2-SHA256 hash check |
| Highest Current Alert | High: Account lockout triggered |

## 3. Explain Mode Summary

Attack Explanation:
The attacker tries candidate passwords one by one until the correct credential is found.

Defense Explanation:
Password hashes are checked safely, and account lockout stops repeated attempts before the correct password is reached.

Attack Flow:
- Attacker loads a small dictionary of candidate passwords.
- Each candidate is submitted to the authentication server.
- Without lockout, the correct password can eventually match.
- Successful match compromises the account.

Defense Flow:
- Failed login counter starts tracking attempts.
- Password checks use PBKDF2-SHA256 hashes instead of plain text storage.
- Account lockout triggers after repeated failed attempts.
- Correct password is never reached by the attacker.

Key Takeaway:
Password hashing protects stored passwords, while lockout and rate limiting reduce brute-force success.

## 4. Before Vs After Result

| Field | Without Defense | With Defense |
| --- | --- | --- |
| Outcome | Attack Successful | Attack Blocked |
| Risk Score | 100/100 | 24/100 |
| Risk Reduction | N/A | 76 points |
| Channel | Credential Guessing Exposed | Account Lockout Active |
| Channel Status | compromised | locked |
| Protection | PBKDF2-SHA256 hash check | PBKDF2-SHA256 hash check |
| Packets Observed | 4 | 4 |
| Intercepted Packets | 1 | 1 |
| Readable Packets | 4 | 4 |
| Highest Alert | Critical: Credential guessed successfully | High: Account lockout triggered |

Interpretation:
The unprotected run shows the attacker impact before controls are applied. The defended run shows the same scenario after cryptographic or network protection is enabled. In this scenario, the defense changes the result from attack successful to attack blocked.

## 5. Metric Evidence

| Metric | Current | Without Defense | With Defense | Defended Meaning |
| --- | --- | --- | --- | --- |
| Login Attempts | 03 | 04 | 03 | dictionary candidates tested |
| Hash Checks | 03 | 04 | 03 | PBKDF2 comparisons |
| Account Status | LOCK | OPEN | LOCK | lockout triggered |
| Alert Priority | P2 | P1 | P2 | credential attack |

## 6. Packet Evidence

| Packet | Without Defense Status | Without Defense Payload | With Defense Status | With Defense Payload |
| --- | --- | --- | --- | --- |
| login-001 | HTTPS Login / rejected | user=student_operator password=password123 | HTTPS Login / rejected | user=student_operator password=password123 |
| login-002 | HTTPS Login / rejected | user=student_operator password=admin12345 | HTTPS Login / rejected | user=student_operator password=admin12345 |
| login-003 | HTTPS Login / rejected | user=student_operator password=cyberlab2026 | HTTPS Login / rejected | user=student_operator password=cyberlab2026 |
| login-004 | HTTPS Login / accepted | user=student_operator password=SecurePass123 | Security Event / locked | Account student_operator locked after 3 failed attempts |

Most Useful Captured Preview Without Defense:
user=student_operator password=SecurePass123

Most Useful Captured Preview With Defense:
user=student_operator password=cyberlab2026

## 7. Alert Evidence

### Current Alerts

| Time | Severity | Title |
| --- | --- | --- |
| 10:12:14 | High | Account lockout triggered |
| 10:12:13 | Medium | Repeated failed login attempts detected |
| 10:12:11 | Medium | Password guessing pattern observed |

### Without Defense Alerts

| Time | Severity | Title |
| --- | --- | --- |
| 10:12:14 | Critical | Credential guessed successfully |
| 10:12:13 | High | Multiple failed attempts before success |
| 10:12:11 | Medium | Dictionary attack started |

### With Defense Alerts

| Time | Severity | Title |
| --- | --- | --- |
| 10:12:14 | High | Account lockout triggered |
| 10:12:13 | Medium | Repeated failed login attempts detected |
| 10:12:11 | Medium | Password guessing pattern observed |

## 8. Defense State Changes

| Defense Control | Without Defense | With Defense |
| --- | --- | --- |
| Password Hashing | Active | Active |
| Account Lockout | Inactive | Locked |
| Rate Limiting | Inactive | Active |
| Login Alerting | Raised | Raised |

## 9. Execution Logs

### Without Defense - Attacker Logs

```text
[10:12:10] Loaded dictionary with candidate passwords
[10:12:11] Attempt 1: password123 -> rejected
[10:12:12] Attempt 2: admin12345 -> rejected
[10:12:13] Attempt 3: cyberlab2026 -> rejected
[10:12:14] Attempt 4: SecurePass123 -> MATCH
[10:12:14] Attack outcome: credential recovered for student_operator
```

### Without Defense - Defender Logs

```text
[10:12:10] Authentication monitor online
[10:12:11] Lockout policy inactive
[10:12:14] Password hash matched after 4 attempts
[10:12:15] Alert P1 raised for compromised credential
```

### With Defense - Attacker Logs

```text
[10:12:10] Loaded dictionary with candidate passwords
[10:12:11] Attempt 1: password123 -> rejected
[10:12:12] Attempt 2: admin12345 -> rejected
[10:12:13] Attempt 3: cyberlab2026 -> rejected
[10:12:14] Attack outcome: account locked before password discovery
```

### With Defense - Defender Logs

```text
[10:12:10] Authentication monitor online
[10:12:11] Failed-login counter armed
[10:12:11] Hash check failed; counter=1
[10:12:12] Hash check failed; counter=2
[10:12:13] Hash check failed; counter=3
[10:12:14] Lockout policy enforced for student_operator
```

## 10. Final Conclusion

CyberShield demonstrates the selected cyber attack in two controlled states. Without defense, the report records what the attacker can capture or exploit. With defense enabled, the report records how encryption, hashing, nonces, lockout, or traffic protection changes the result and reduces operational risk.
