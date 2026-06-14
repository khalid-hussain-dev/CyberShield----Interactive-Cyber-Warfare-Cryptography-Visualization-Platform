# CyberShield Backend

Flask backend scaffold for the CyberShield cryptography and network security lab project.

## Run locally

```powershell
python run.py
```

The API starts on `http://127.0.0.1:5000`.

## Verify

```powershell
python -m unittest discover -s tests
```

## Current modules

- `app.routes.health`: backend health endpoint
- `app.routes.crypto`: educational crypto API endpoints
- `app.crypto_engine`: AES-256-GCM, RSA-OAEP, SHA-256, and digital signatures
- `app.utils.responses`: consistent API response shape

