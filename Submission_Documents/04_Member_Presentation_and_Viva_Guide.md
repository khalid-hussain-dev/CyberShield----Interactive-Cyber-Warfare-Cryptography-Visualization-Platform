# Member Presentation And Viva Guide

This document gives each member a clear explanation of what to say during the project exhibition and viva.

## Overall Project Explanation

CyberShield is an interactive cybersecurity simulation platform.

It demonstrates how common attacks work and how cryptographic or network security defenses stop them.

The user first logs in or registers. Then they enter the command dashboard. They choose a scenario, click `Launch`, observe attack logs and alerts, then click `Defend` to activate protection.

The project includes four scenarios:

1. Bank Transaction MITM.
2. Password Brute Force.
3. Packet Sniffing.
4. Replay Attack.

The platform uses:

- React frontend.
- Flask backend.
- SQLite database.
- JWT authentication.
- AES, RSA, SHA-256, digital signatures.
- Flask-SocketIO for real-time updates.

## Demo Flow For Exhibition

1. Open frontend.
2. Register or login.
3. Show dashboard.
4. Explain navbar logo:
   - Blue means neutral.
   - Red means attack running.
   - Green means threat neutralized.
5. Select Bank MITM.
6. Click `Launch`.
7. Show red popup and hacker terminal.
8. Click `Defend`.
9. Show green popup and defender console.
10. Repeat quickly with brute force, packet sniffing, and replay attack.
11. Explain backend concepts and crypto concepts.

## Khalid Presentation Guide

### What Khalid Should Say

> My role was project leadership, backend architecture, simulation engine, and real-time integration. I structured the backend so each scenario follows one common format. This format includes metrics, packets, alerts, attack logs, defense logs, active defenses, and an event stream. Because of this, the frontend can display all scenarios using the same dashboard components.

### Work Area Explanation

Khalid worked on the backend foundation.

How it was implemented:

1. Flask app factory was created.
2. Routes were separated into modules.
3. Simulation engine folder was created.
4. Each attack scenario was implemented as a separate file.
5. A scenario service chooses the correct scenario builder.
6. Event stream builder converts scenario data into live WebSocket events.
7. Flask-SocketIO sends those events to the frontend.

### Modules To Mention

- `simulation_service.py`
- `scenario_catalog.py`
- `bank_mitm_scenario.py`
- `password_bruteforce_scenario.py`
- `packet_sniffing_scenario.py`
- `replay_attack_scenario.py`
- `event_stream.py`
- `events.py`

### Viva Questions For Khalid

**Q: Why did you make a simulation engine instead of writing everything directly in frontend?**  
A: Because the backend should control attack logic. This makes scenarios reusable, testable, and closer to real system architecture.

**Q: What does the simulation engine return?**  
A: It returns scenario information, metrics, packets, alerts, attack logs, defense logs, defense status, and event stream.

**Q: Why use WebSockets?**  
A: WebSockets allow the backend to push live updates to the frontend without waiting for repeated HTTP requests.

**Q: What is the benefit of modular backend design?**  
A: Each module has one responsibility, so the system is easier to maintain and expand.

**Q: Which scenario is most important?**  
A: Bank MITM is the clearest cryptography demonstration because it shows plaintext interception and encrypted protection.

## Nauman Presentation Guide

### What Nauman Should Say

> My role was frontend development and user experience. I designed the dashboard as a cybersecurity command center. I implemented the login/register screen, scenario selection, network visualization, metrics, alerts, hacker terminal, defender console, loading screens, popup messages, and logo-based status indicators.

### Work Area Explanation

Nauman worked on the frontend interface.

How it was implemented:

1. React and Vite were used for the frontend.
2. Tailwind CSS created the dark dashboard design.
3. Reusable components were created for cards, alerts, terminals, panels, and status pills.
4. AuthGate was created so login/register appears before dashboard.
5. NetworkVisualizer changes layout depending on selected scenario.
6. BrandLoader displays logo-based loading animations.
7. ActionNotice displays attack and defense popup feedback.

### Modules To Mention

- `App.jsx`
- `AuthGate.jsx`
- `NetworkVisualizer.jsx`
- `BrandLoader.jsx`
- `ActionNotice.jsx`
- `NavbarLogo.jsx`
- `MetricCard.jsx`
- `EventFeed.jsx`
- `TerminalStream.jsx`

### Viva Questions For Nauman

**Q: Why is the UI dark?**  
A: The project context required a SOC-style cybersecurity command center. Dark UI improves focus and fits security monitoring dashboards.

**Q: How does the frontend know attack state?**  
A: It receives state from backend REST APIs and live events from Socket.IO.

**Q: Why does the logo color change?**  
A: It gives quick visual feedback. Blue means neutral, red means attack, green means threat neutralized.

**Q: What happens when Launch is clicked?**  
A: A loading screen appears, then the selected attack starts, logs and alerts update, and a red intrusion popup appears.

**Q: What happens when Defend is clicked?**  
A: A defense loading screen appears, defense mode activates, and the system shows a green neutralized popup.

## Hussain Presentation Guide

### What Hussain Should Say

> My role was the cryptography engine. I implemented AES-256-GCM, RSA-OAEP, digital signatures using RSA-PSS, and SHA-256 hashing. These cryptographic services support the project scenarios and demonstrate confidentiality, integrity, authentication, and secure communication concepts.

### Work Area Explanation

Hussain worked on cryptographic services.

How it was implemented:

1. AES service encrypts and decrypts text using AES-256-GCM.
2. RSA service generates public/private key pairs.
3. RSA encryption uses OAEP with SHA-256.
4. Signature service signs and verifies messages.
5. Hash service creates SHA-256 digests.
6. Crypto routes expose these services through API endpoints.

### Modules To Mention

- `aes_service.py`
- `rsa_service.py`
- `signature_service.py`
- `hash_service.py`
- `encoding.py`
- `routes/crypto.py`

### Viva Questions For Hussain

**Q: What is AES used for in this project?**  
A: AES encrypts sensitive payloads so intercepted data becomes unreadable ciphertext.

**Q: Why AES-256-GCM?**  
A: AES-256 is strong, and GCM provides both confidentiality and integrity.

**Q: What is RSA used for?**  
A: RSA demonstrates public/private key encryption and secure key exchange concepts.

**Q: What is a digital signature?**  
A: It proves message authenticity and detects tampering.

**Q: Where is SHA-256 used?**  
A: It is used in the crypto API and for replay request fingerprinting.

## Shabbir Presentation Guide

### What Shabbir Should Say

> My role was authentication, database, and API response standards. I implemented register/login, password hashing, JWT token-based sessions, SQLite user storage, and consistent backend response formatting.

### Work Area Explanation

Shabbir worked on user access and backend reliability.

How it was implemented:

1. User registers with username, email, and password.
2. Password is hashed before saving.
3. SQLite stores user records.
4. Login checks password hash.
5. Backend creates JWT access token.
6. Frontend stores token and uses `/api/auth/me` to restore session.
7. API responses use success, message, and data format.

### Modules To Mention

- `auth_service.py`
- `password_service.py`
- `token_service.py`
- `user_repository.py`
- `storage.py`
- `routes/auth.py`
- `responses.py`
- `errors.py`

### Viva Questions For Shabbir

**Q: Where are users stored?**  
A: Users are stored in SQLite at `backend/app/instance/cybershield.sqlite`.

**Q: Are passwords stored directly?**  
A: No. Passwords are hashed using PBKDF2-SHA256.

**Q: What is JWT?**  
A: JWT is a signed token used to identify logged-in users.

**Q: Why is login required?**  
A: It protects the dashboard and makes the system closer to a real security platform.

**Q: What is the API response format?**  
A: Every response follows `{ success, message, data }`.

## Sakhawat Presentation Guide

### What Sakhawat Should Say

> My role was testing, documentation, and demo preparation. I verified authentication, cryptography, simulation routes, and WebSocket events. I also prepared final documentation, viva questions, and a demonstration flow for the exhibition.

### Work Area Explanation

Sakhawat worked on validation and presentation readiness.

How it was implemented:

1. Backend tests were written using Python unittest.
2. Authentication routes were tested.
3. Crypto round trips were tested.
4. Every scenario was tested in attack and defense mode.
5. WebSocket simulation events were tested.
6. Frontend lint and build were run.
7. Submission documents were prepared.

### Modules To Mention

- `backend/tests/test_auth_routes.py`
- `backend/tests/test_crypto_engine.py`
- `backend/tests/test_simulation_routes.py`
- `backend/tests/test_realtime_events.py`
- `Submission_Documents/`

### Viva Questions For Sakhawat

**Q: How did you verify the project?**  
A: I used backend unit tests, frontend lint/build, and smoke tests through REST and WebSocket APIs.

**Q: What do the simulation tests check?**  
A: They check that attacks succeed without defense and fail when defense is active.

**Q: Why are tests important?**  
A: Tests prove that the project works correctly and prevent accidental breakage.

**Q: What is the purpose of documentation?**  
A: Documentation helps explain the project, member responsibilities, CNS concepts, and viva answers.

**Q: What is the demo sequence?**  
A: Login, select scenario, launch attack, observe hacker/defender logs, activate defense, show neutralized result.

## Common Viva Questions For Whole Group

**Q: Is this project using real attacks?**  
A: It uses controlled simulations, not harmful real attacks. This is safer and suitable for education.

**Q: Is packet sniffing real network sniffing?**  
A: No. It is simulated packet capture to demonstrate the concept without needing real network access.

**Q: Is encryption real?**  
A: Yes. AES, RSA, signatures, and hashes are implemented using Python cryptography libraries.

**Q: Why use SQLite?**  
A: SQLite is lightweight and suitable for local academic development. PostgreSQL can be added later.

**Q: What is incomplete?**  
A: Advanced future enhancements such as AI IDS, real packet capture, cloud deployment, and VR are not implemented.

**Q: What makes the project relevant to CNS?**  
A: It combines cryptographic algorithms with network attack simulations and defense mechanisms.

## Final Closing Statement

> CyberShield bridges theory and practice. Instead of only explaining AES, RSA, brute force, MITM, packet sniffing, and replay attacks in words, the system lets users launch attacks, see what the attacker observes, activate defenses, and understand how cryptography protects communication.

