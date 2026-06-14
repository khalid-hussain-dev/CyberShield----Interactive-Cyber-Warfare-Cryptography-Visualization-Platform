# Cryptography And Network Security Concepts Guide

This guide explains the Cryptography and Network Security concepts used in CyberShield, why they were selected, and how they are used in the project.

## 1. AES-256-GCM

### What It Is

AES is a symmetric encryption algorithm. Symmetric means the same key is used for encryption and decryption.

AES-256 means the key size is 256 bits.

GCM mode provides:

- Confidentiality: attackers cannot read the message.
- Integrity: modified ciphertext will fail authentication.

### Why It Was Chosen

AES is widely used in real secure systems because it is fast and strong.

It was chosen because the project needs to show how plaintext becomes unreadable ciphertext during attacks like MITM and packet sniffing.

### Usage In CyberShield

AES-256-GCM is used in:

- Bank MITM defense.
- Packet sniffing defense.
- Crypto API routes.

Example in project:

Without defense, attacker sees:

`TXN|from=ACCT-7721|amount=2450 PKR`

With AES defense, attacker sees ciphertext:

`Vv8X...random encrypted text...`

### Role In Project

AES shows the difference between insecure communication and secure communication.

It proves that even if an attacker captures a packet, encryption prevents them from understanding the data.

## 2. RSA Encryption

### What It Is

RSA is an asymmetric encryption algorithm.

Asymmetric means it uses two keys:

- Public key: shared with others.
- Private key: kept secret.

Data encrypted with the public key can only be decrypted by the private key.

### Why It Was Chosen

RSA is commonly taught in cryptography courses and is important for secure key exchange.

It was chosen to demonstrate public/private key security.

### Usage In CyberShield

RSA-OAEP-SHA256 is implemented in the crypto engine.

Backend routes can:

- Generate RSA key pairs.
- Encrypt text using public key.
- Decrypt text using private key.

### Role In Project

RSA represents asymmetric protection and secure key exchange concepts.

In real secure systems, RSA or similar public key systems help exchange keys safely before symmetric encryption begins.

## 3. Digital Signatures

### What They Are

A digital signature proves:

- Who sent the message.
- Whether the message was changed.

The sender signs data with a private key.

The receiver verifies it with the public key.

### Why It Was Chosen

Digital signatures directly support integrity and authentication, which are important CNS topics.

### Usage In CyberShield

CyberShield implements RSA-PSS-SHA256 signatures.

The backend can:

- Sign a message.
- Verify a signature.
- Detect tampering.

### Role In Project

Digital signatures show how systems prevent attackers from silently changing data.

They are part of the cryptographic engine and can be used to explain message authenticity.

## 4. SHA-256 Hashing

### What It Is

SHA-256 is a cryptographic hash function.

It converts input data into a fixed-length digest.

Properties:

- Same input gives same hash.
- Different input gives different hash.
- Original data cannot be recovered from the hash.

### Why It Was Chosen

SHA-256 is standard, reliable, and easy to demonstrate.

### Usage In CyberShield

SHA-256 is used in:

- Crypto engine hash API.
- Replay attack request fingerprinting.

In Replay Attack, the original request is fingerprinted. When the attacker sends the same request again, the system can identify that it is a duplicate.

### Role In Project

SHA-256 helps show integrity and duplicate detection.

## 5. Password Hashing With PBKDF2-SHA256

### What It Is

Password hashing stores a password in protected form.

Instead of saving the original password, the system saves a hash.

PBKDF2-SHA256 applies SHA-256 repeatedly, making password guessing slower.

### Why It Was Chosen

It is built into Werkzeug, works well with Flask, and is suitable for educational authentication.

### Usage In CyberShield

Used in:

- Register/login system.
- Password brute-force scenario.

When a user registers, their password is hashed before saving to SQLite.

### Role In Project

It proves that real systems should never store plain-text passwords.

It also supports the brute-force scenario because candidate passwords are checked against a password hash.

## 6. JWT Authentication

### What It Is

JWT means JSON Web Token.

After login, the backend gives the frontend a signed token.

The frontend uses this token to prove that the user is authenticated.

### Why It Was Chosen

JWT is common in modern web apps and works well with React plus Flask APIs.

### Usage In CyberShield

Used in:

- Login/register access gate.
- Session restore.
- Protected `/api/auth/me` route.

### Role In Project

JWT ensures that users must login or register before entering the system dashboard.

## 7. Man-in-the-Middle Attack

### What It Is

MITM means an attacker comes between sender and receiver and intercepts communication.

### Usage In CyberShield

Scenario: Bank Transaction Interception.

Without defense:

- Attacker reads transaction data.

With defense:

- AES encryption hides transaction data.

### Role In Project

MITM demonstrates why encrypted communication is necessary.

## 8. Brute Force Attack

### What It Is

Brute force means trying many passwords until the correct one is found.

### Usage In CyberShield

Scenario: Password Brute Force.

Without defense:

- Attacker discovers the password.

With defense:

- Account lockout stops the attack.

### Role In Project

Shows why login systems need lockout, rate limiting, and password hashing.

## 9. Packet Sniffing

### What It Is

Packet sniffing means capturing traffic traveling across a network.

### Usage In CyberShield

Scenario: Packet Sniffing.

Without defense:

- Captured packets show readable mail, file, and API data.

With defense:

- Captured packets show ciphertext.

### Role In Project

Shows why network traffic should be encrypted.

## 10. Replay Attack

### What It Is

Replay attack means capturing a valid request and sending it again later.

### Usage In CyberShield

Scenario: Replay Attack.

Without defense:

- Duplicate payment request is accepted.

With defense:

- Duplicate nonce/session fingerprint is rejected.

### Role In Project

Shows why systems use nonces, timestamps, and session validation.

## 11. Nonce Protection

### What It Is

A nonce is a number or value used only once.

If the same nonce appears again, the system knows the request is reused.

### Usage In CyberShield

Used in Replay Attack defense.

### Role In Project

Prevents captured requests from being reused successfully.

## 12. WebSockets

### What They Are

WebSockets allow real-time communication between frontend and backend.

Unlike normal HTTP requests, the connection stays open.

### Usage In CyberShield

Flask-SocketIO streams:

- Simulation state.
- Packet events.
- Attack logs.
- Defense logs.
- Alerts.

### Role In Project

Makes the dashboard feel live and interactive.

## 13. SQLite Database

### What It Is

SQLite is a lightweight local database.

### Usage In CyberShield

Stores registered users.

Database path:

`backend/app/instance/cybershield.sqlite`

### Role In Project

Provides persistent user login/register support without needing a separate database server.

## 14. Final Concept Summary

CyberShield combines:

- Cryptography: AES, RSA, SHA-256, signatures, password hashing.
- Network Security: MITM, packet sniffing, brute force, replay attack.
- Defense Mechanisms: encryption, lockout, nonce protection, monitoring.
- Real-time System Design: WebSockets and event streams.
- Secure Web Application Concepts: JWT, database users, protected dashboard.

The project is useful because students can see what happens before and after security is applied.

