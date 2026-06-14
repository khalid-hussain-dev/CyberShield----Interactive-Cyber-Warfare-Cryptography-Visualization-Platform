📄 PROJECT_CONTEXT.md
CyberShield — Interactive Cyber Warfare & Cryptography Visualization Platform
1. PROJECT OVERVIEW
Project Name

CyberShield

Project Type

Interactive Cybersecurity Simulation Platform

Core Purpose

CyberShield is an immersive web-based platform that demonstrates cyber attacks and cryptographic defenses through real-time visualization, attack-defense simulations, and dual-perspective monitoring dashboards.

The platform is designed to:

simulate cyber attacks,
visualize vulnerabilities,
demonstrate cryptographic protection mechanisms,
and provide an engaging cybersecurity learning experience.
2. CORE PROJECT PHILOSOPHY

CyberShield must feel like:

a professional cybersecurity command center,
not a simple academic project.

The project should prioritize:

clarity,
realism,
immersion,
and technical coherence.
3. DESIGN PRINCIPLES
UI Style
Dark cyber-defense aesthetic
Clean tactical dashboard
Minimal clutter
High readability
Modern professional feel
Visual Inspiration

The UI should resemble:

SOC (Security Operations Center) dashboards
Cyber defense monitoring systems
Real-time command interfaces

Avoid:

childish hacker aesthetics,
excessive neon overload,
meme-like cyberpunk visuals.
Animation Philosophy

Animations must:

communicate system activity,
enhance immersion,
never feel decorative only.

Animations should represent:

packet movement,
attacks,
alerts,
encryption transitions,
network activity.
4. COLOR SYSTEM
Primary Colors
Background: #0B1020
Panel: #121A2B
Primary Blue: #3B82F6
Danger Red: #EF4444
Success Green: #22C55E
Warning Yellow: #F59E0B
Text Primary: #E5E7EB
Text Secondary: #94A3B8
5. TYPOGRAPHY
Fonts

Primary:

Inter

Optional:

JetBrains Mono (for terminals/logs)
6. CORE SYSTEM MODULES
FRONTEND MODULES
Dashboard Module

Contains:

overview statistics,
active attacks,
security status,
live alerts.
Attack Visualization Module

Contains:

packet movement,
network map,
attacker/client/server nodes,
real-time animations.
Scenario Engine UI

Handles:

scenario selection,
attack launching,
defense activation.
Hacker Terminal UI

Displays:

intercepted packets,
attack logs,
brute-force attempts,
terminal output.
Defender Console UI

Displays:

security alerts,
encryption status,
attack mitigation logs,
system health.
BACKEND MODULES
Authentication Module

Responsibilities:

JWT authentication,
user sessions,
password hashing.
Crypto Engine

Responsibilities:

AES encryption/decryption,
RSA encryption/decryption,
digital signatures,
hashing utilities.
Simulation Engine

Responsibilities:

attack execution,
packet generation,
attack state management,
event triggering.
Scenario Manager

Responsibilities:

loading simulation scenarios,
managing attack sequences,
coordinating defense states.
WebSocket Manager

Responsibilities:

real-time updates,
synchronized frontend events,
packet event broadcasting.
7. INITIAL ATTACK SCENARIOS
Scenario 1 — Bank Transaction Interception

Attack Type:

MITM Attack

Goal:
Demonstrate:

plaintext interception,
encrypted protection.
Scenario 2 — Password Brute Force

Attack Type:

Brute Force Attack

Goal:
Demonstrate:

password cracking,
account lock/security response.
Scenario 3 — Packet Sniffing

Attack Type:

Packet Capture

Goal:
Demonstrate:

insecure communication visibility,
encrypted traffic protection.
Scenario 4 — Replay Attack

Attack Type:

Replay Attack

Goal:
Demonstrate:

packet reuse attack,
nonce/session protection.
8. SECURITY IMPLEMENTATIONS
Symmetric Encryption
AES-256
Asymmetric Encryption
RSA
Integrity & Authentication
SHA-256
Digital Signatures
9. FRONTEND TECH STACK
Core
React.js
Vite
Styling
Tailwind CSS
Animation
Framer Motion
Visualization
D3.js
OR
HTML5 Canvas
10. BACKEND TECH STACK
Framework
Flask
Real-Time Communication
Flask-SocketIO
Database

Development:

SQLite

Production/Advanced:

PostgreSQL
Cryptography

Python libraries:

cryptography
pycryptodome
11. CODING STANDARDS
GENERAL RULES
RULE 1

Never generate large uncontrolled files.

RULE 2

All modules must remain isolated and modular.

RULE 3

Avoid hardcoded values.

RULE 4

All API responses must use consistent JSON structure.

Example:

{
  "success": true,
  "message": "Encryption successful",
  "data": {}
}
RULE 5

Frontend components must remain reusable.

RULE 6

Use descriptive naming conventions.

BAD:

temp.js
data.py

GOOD:

packetVisualizer.jsx
aesEncryptionService.py
12. DEVELOPMENT PHILOSOPHY
IMPORTANT

Development must occur:

module-by-module,
not feature-chaotically.
DEVELOPMENT ORDER
Stage 1

Frontend shell/layout

Stage 2

Authentication system

Stage 3

Crypto engine

Stage 4

Simulation engine

Stage 5

WebSocket integration

Stage 6

Visualization layer

Stage 7

Scenario integration

Stage 8

Polish and optimization

13. AI DEVELOPMENT RULES
When using Codex:
ALWAYS:
define exact scope,
define constraints,
define expected output,
define folder destination.
NEVER:
ask for entire project generation,
generate huge uncontrolled architecture,
combine multiple unrelated systems in one prompt.
GOOD PROMPT STRUCTURE
Task
Requirements
Constraints
Expected Output
Folder Structure
Coding Standards
14. UI/UX REQUIREMENTS
Dashboard must contain:
live alerts,
attack statistics,
active defenses,
packet activity.
Attack visualization must:
animate packets,
show interception,
display encryption transformation.
Terminal windows must:
feel realistic,
use monospace fonts,
auto-scroll logs.
15. PERFORMANCE RULES

Animations must remain:

smooth,
optimized,
lightweight.

Avoid:

excessive particle effects,
unnecessary rendering,
lag-heavy visual effects.
16. PROJECT GOAL

CyberShield should demonstrate:

cybersecurity concepts,
cryptographic implementation,
real-time system interaction,
and immersive visualization

in a way that feels:

technically advanced,
visually professional,
academically relevant,
and memorable.
17. FINAL DEVELOPMENT PRINCIPLE

The project must always prioritize:

Clarity > Complexity
Immersion > Decoration
Architecture > Random Features
Consistency > Overengineering