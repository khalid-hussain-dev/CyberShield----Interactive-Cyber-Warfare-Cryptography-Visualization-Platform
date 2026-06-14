# Group Member Roles

This document divides CyberShield into five presentation ownership areas. The distribution is intentionally not exactly equal because some modules required more work than others.

## Work Distribution Summary

| Member | Workload Level | Main Area |
|---|---:|---|
| Khalid | Highest | Project architecture, backend core, simulation engine, integration |
| Nauman | Second highest | Frontend dashboard, UI/UX, visualization, auth screen |
| Hussain | Third | Cryptography engine and security logic |
| Shabbir | Medium | Authentication, database, API structure |
| Sakhawat | Medium | Testing, documentation, demo preparation, QA |

Approximate workload:

- Khalid: 30%
- Nauman: 24%
- Hussain: 19%
- Shabbir: 13.5%
- Sakhawat: 13.5%

## 1. Khalid - Project Lead, Backend Architecture, Simulation Engine

### Main Responsibilities

Khalid handled the main backend architecture and coordinated the project flow.

His areas:

- Overall project planning.
- Backend folder structure.
- Flask app setup.
- Simulation engine design.
- Scenario manager.
- WebSocket integration.
- Final frontend-backend integration.

### Modules Owned

- `backend/app/__init__.py`
- `backend/app/routes/simulation.py`
- `backend/app/simulation_engine/`
- `backend/app/realtime/events.py`
- `backend/app/extensions.py`

### Work Details

Khalid designed the system so every attack scenario returns the same type of data:

- Scenario details.
- Attack success or failure.
- Metrics.
- Packets.
- Alerts.
- Hacker logs.
- Defender logs.
- Active defenses.
- Realtime event stream.

This made the frontend reusable because the dashboard did not need a different layout for every attack.

### How He Should Explain His Work

> I worked on the backend architecture and simulation engine. I designed a common response structure for all attack scenarios so the frontend could show every scenario in the same dashboard. I also integrated Flask-SocketIO so the backend can stream live events like packet movement, attack logs, and defense alerts.

### Key Points To Mention

- Backend is modular.
- Every API response follows the same JSON pattern.
- All four scenarios are backend-generated.
- WebSockets make the dashboard real-time.
- REST APIs still exist as backup and for initial state.

## 2. Nauman - Frontend UI/UX, Dashboard, Visualization

### Main Responsibilities

Nauman handled the user interface and dashboard experience.

His areas:

- Login/register screen.
- CyberShield dashboard layout.
- Scenario selection panel.
- Network visualization.
- Hacker Terminal.
- Defender Console.
- Live alerts panel.
- Active defenses panel.
- Loading animations and popup feedback.
- Logo and favicon integration.

### Modules Owned

- `frontend/src/App.jsx`
- `frontend/src/components/AuthGate.jsx`
- `frontend/src/components/NetworkVisualizer.jsx`
- `frontend/src/components/MetricCard.jsx`
- `frontend/src/components/EventFeed.jsx`
- `frontend/src/components/TerminalStream.jsx`
- `frontend/src/components/BrandLoader.jsx`
- `frontend/src/components/ActionNotice.jsx`
- `frontend/src/components/NavbarLogo.jsx`

### Work Details

Nauman created a SOC-style command center interface. The dashboard uses dark colors, tactical panels, logs, metrics, icons, and animated packet movement.

He also made sure the system does not start attacks automatically. The user must click `Launch`, and then the UI shows loading and attack feedback.

### How He Should Explain His Work

> I focused on the frontend and user experience. My goal was to make the system feel like a real cybersecurity command center. I created the login/register gate, dashboard layout, scenario selector, animated attack visualization, live alerts, and terminal consoles. I also added the project logos, favicon, launch loading screen, and attack/defense popup messages.

### Key Points To Mention

- UI uses React, Vite, Tailwind CSS, Framer Motion, and Lucide icons.
- Login/register screen appears before dashboard.
- Navbar logo changes color based on system state.
- Attack and defense both show branded loading screens.
- Visualization changes depending on selected scenario.

## 3. Hussain - Cryptography Engine And Security Logic

### Main Responsibilities

Hussain handled the cryptographic implementation and security mechanisms.

His areas:

- AES encryption/decryption.
- RSA encryption/decryption.
- Digital signatures.
- SHA-256 hashing.
- Replay fingerprinting.
- Password hash verification support.
- Crypto API routes.

### Modules Owned

- `backend/app/crypto_engine/aes_service.py`
- `backend/app/crypto_engine/rsa_service.py`
- `backend/app/crypto_engine/signature_service.py`
- `backend/app/crypto_engine/hash_service.py`
- `backend/app/routes/crypto.py`

### Work Details

Hussain implemented the cryptographic services that support the educational demonstrations.

AES-256-GCM is used to turn readable packets into ciphertext. RSA and digital signatures are available through the crypto API. SHA-256 is used for hashing and replay request fingerprinting.

### How He Should Explain His Work

> I worked on the cryptography engine. I implemented AES-256-GCM for symmetric encryption, RSA-OAEP for asymmetric encryption, RSA-PSS for digital signatures, and SHA-256 hashing. These concepts are used to show how encryption protects intercepted packets, how hashes detect duplicate requests, and how digital signatures provide integrity and authenticity.

### Key Points To Mention

- AES protects packet contents.
- RSA demonstrates public/private key cryptography.
- Digital signatures verify message authenticity.
- SHA-256 creates fixed fingerprints.
- Crypto routes allow testing each cryptographic function.

## 4. Shabbir - Authentication, Database, API Standards

### Main Responsibilities

Shabbir handled user authentication and backend API consistency.

His areas:

- Register/login system.
- Password hashing.
- JWT access tokens.
- SQLite database.
- Protected session route.
- API response format.
- Backend error handling.

### Modules Owned

- `backend/app/auth/`
- `backend/app/routes/auth.py`
- `backend/app/utils/responses.py`
- `backend/app/utils/errors.py`
- `backend/app/config.py`

### Work Details

Shabbir made sure users must login or register before accessing the dashboard.

Passwords are stored as hashes, not plain text. JWT tokens are used to restore sessions. SQLite stores registered users locally.

### How He Should Explain His Work

> I worked on authentication and backend API standards. I implemented register and login functionality, password hashing, JWT token generation, and SQLite user storage. I also helped standardize API responses so every backend route returns success, message, and data in the same format.

### Key Points To Mention

- Users are stored in SQLite.
- Passwords are hashed.
- JWT token is used after login.
- Dashboard is protected by authentication.
- API responses are consistent.

## 5. Sakhawat - Testing, Documentation, Demo Preparation

### Main Responsibilities

Sakhawat handled testing, documentation, and presentation preparation.

His areas:

- Backend unit tests.
- Scenario behavior verification.
- Socket.IO event testing.
- Documentation preparation.
- Demo flow checking.
- Viva question preparation.
- Final project review.

### Modules Owned

- `backend/tests/`
- `Submission_Documents/`
- Demo workflow and presentation guide.

### Work Details

Sakhawat verified that each scenario works in both attack and defense mode.

He also helped prepare explanation documents so each member can understand and present their module clearly.

### How He Should Explain His Work

> I focused on testing and documentation. I verified that all four scenarios work correctly in attack and defense mode. I also checked the WebSocket event stream and prepared the final documentation, role explanations, viva questions, and demo sequence for the exhibition.

### Key Points To Mention

- Tests cover authentication, crypto, simulation routes, and real-time events.
- Every scenario has both attack and defense verification.
- Documentation explains concepts and member responsibilities.
- Demo flow is prepared for exhibition.

## Final Team Presentation Line

> Our team divided the project into backend architecture, frontend dashboard, cryptography, authentication/database, and testing/documentation. Together these modules form CyberShield, an interactive platform that demonstrates cyber attacks and cryptographic defenses in real time.

