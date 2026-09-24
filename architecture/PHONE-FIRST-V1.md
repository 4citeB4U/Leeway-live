# LeeWay Live — GitHub Pages → Phone Architecture

## MASTER CHECKPOINT

LeeWay Live is a GitHub-first, phone-executed sensory harness.

There is no required PC runtime and no canonical host-drive dependency.

```text
GitHub Pages: LeeWay Live
        ↓
discover canonical package manifest
        ↓
Download Android package
        ↓
phone-local LeeWay runtime
        ↓
model + voice + vision + relay + device bridge
        ↓
Agent Skills / Formula / Device Bridge GitHub authorities
        ↓
Veritas evidence + receipts
```

## Public front door

LeeWay Live Pages is responsible for:

- bootstrap and installer UI
- discovering the newest authorized Android package from `LEEWAY-DEVICE-BRIDGE`
- showing package version, size, and SHA-256
- exposing GitHub authority/status information
- optional browser diagnostics
- never inventing native runtime success

The download URL is resolved from the Device Bridge package manifest so the installer does not drift when package versions change.

## Phone runtime authority

The Android package from `4citeB4U/LEEWAY-DEVICE-BRIDGE` is the native execution authority.

Published v0.7 includes:

- LiteRT-LM phone-local model
- model download and SHA-256 verification
- local model inference
- owner authorization
- remote relay
- device providers
- Formula F8 gate
- receipts
- owner stop
- boot restart / reconnect

## Sensory harness v0.8 source

The staged v0.8 source adds:

```text
VOICE
owner tap
→ microphone permission
→ Android SpeechRecognizer
→ prefer on-device recognizer when available
→ phone-local LiteRT model
→ Android TextToSpeech
→ receipt

VISION
owner tap
→ camera permission
→ camera capture
→ bundled ML Kit image labeling
→ phone-local LiteRT model reasoning
→ Android TextToSpeech
→ receipt
```

Remote-safe sensory capabilities:

- `sensory.status`
- `sensory.speak`

Remote microphone/camera activation is not authorized. Physical sensors remain owner-initiated.

## GitHub authority bindings

LeeWay Live binds to:

- `4citeB4U/LEEWAY-DEVICE-BRIDGE`
- `4citeB4U/LeeWay-Agent-Skills`
- `4citeB4U/Leeway-formula-live`

Repository reachability is not execution.

Formula discovery is not Formula execution.

No divergent Formula engine is embedded in LeeWay Live or Device Bridge.

## Browser diagnostics

The Pages browser model, microphone, camera, and speech synthesis paths are optional diagnostics and fallback experiments.

They are not the phone package authority.

## Promotion gates

G0 — Pages front door resolves canonical manifests  
G1 — Pages Download button resolves current Android package  
G2 — APK builds from canonical Device Bridge source  
G3 — APK hash/size recorded and package manifest updated  
G4 — APK installs on physical phone  
G5 — local model verified  
G6 — microphone → transcript → local model verified  
G7 — local model → spoken phone response verified  
G8 — camera → phone-local vision inference verified  
G9 — vision result → local model → spoken response verified  
G10 — relay connection verified without USB/PC  
G11 — Agent Skills / Formula authority discovery verified  
G12 — owner stop verified  
G13 — Veritas receipt and Learning Ledger correlation

First success is not completion.
