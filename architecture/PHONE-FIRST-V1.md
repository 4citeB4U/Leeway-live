# LeeWay Live — GitHub Pages → Phone Architecture

## MASTER CHECKPOINT

LeeWay Live is a GitHub-first, phone-executed sensory harness and Agent Lee interaction surface.

There is no required PC runtime and no canonical host-drive dependency.

```text
LeeWay Live GitHub Pages
        ↓
bootstrap.json + Device Bridge package manifest
        ↓
Download current Android package
        ↓
phone-local LeeWay runtime
        ↓
model + voice + vision + relay + device capabilities
        ↓
Agent Skills / Formula / Device Bridge GitHub authorities
        ↓
Veritas evidence + receipts
```

## Pages responsibilities

LeeWay Live Pages provides:

- public installer/bootstrap UI
- dynamic discovery of the canonical Android package
- package version / size / SHA-256 display
- direct package download
- 238-skill/task-context interaction path
- Formula authority discovery without fabricated execution
- `CONNECT LOCAL` for optional local Runtime Fabric/Ollama
- browser voice, camera, text, and model diagnostics
- evidence trace

Pages does not become Android device authority.

## Native phone authority

The Android package from `4citeB4U/LEEWAY-DEVICE-BRIDGE` is the native phone execution authority.

Published v0.7 includes:

- LiteRT-LM phone-local model installation and SHA-256 verification
- local model inference
- owner authorization
- persistent outbound relay
- device providers
- Formula F8 gate
- receipts
- owner stop
- boot restart / reconnect

## Sensory v0.8 promotion path

The staged Device Bridge v0.8 source adds:

```text
VOICE
owner tap
→ microphone permission
→ Android SpeechRecognizer
→ prefer on-device recognizer when available
→ phone-local model reasoning
→ Android TextToSpeech
→ receipt

VISION
owner tap
→ camera permission
→ camera capture
→ bundled ML Kit image labeling
→ phone-local model reasoning
→ Android TextToSpeech
→ receipt
```

Remote-safe sensory capabilities:

- `sensory.status`
- `sensory.speak`

Remote microphone/camera activation remains unauthorized. Sensor capture stays owner-initiated.

## GitHub authority bindings

LeeWay Live binds to:

- `4citeB4U/LEEWAY-DEVICE-BRIDGE`
- `4citeB4U/LeeWay-Agent-Skills`
- `4citeB4U/Leeway-formula-live`

Repository reachability is not execution.

Formula service identity is not Formula execution.

No divergent Formula implementation is embedded.

## Promotion gates

G0 — Pages bootstrap manifest valid  
G1 — Device Bridge package manifest resolves  
G2 — installer resolves version / size / SHA-256 / URL  
G3 — Pages UI deployed  
G4 — Android APK built from canonical source  
G5 — APK hash/size recorded and package manifest promoted  
G6 — APK installs on physical phone  
G7 — local model verified  
G8 — microphone → transcript → local model verified  
G9 — model → spoken phone response verified  
G10 — camera → phone-local vision inference verified  
G11 — vision result → local model → spoken response verified  
G12 — relay works without USB/PC  
G13 — Agent Skills / Formula authority discovery verified  
G14 — owner stop verified  
G15 — Veritas receipt / Learning Ledger correlation

First success is not completion.
