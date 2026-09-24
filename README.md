# LeeWay Live

LeeWay Live is the GitHub Pages front door for the LeeWay phone sensory harness and the governed Agent Lee interaction surface.

## Canonical runtime path

```text
GitHub Pages
→ discover canonical Android package
→ user downloads / installs package
→ phone-local LeeWay runtime
→ model + device bridge + relay + sensory capabilities
→ Agent Skills + Formula + Device Bridge GitHub authorities
→ evidence + receipts
```

**GitHub Pages distributes. The phone executes.**

No PC or host drive is required for the deployed runtime path.

## Authority map

- **4citeB4U/Leeway-live** — public bootstrap, installer, interaction UI, browser diagnostics, and local-runtime connector.
- **4citeB4U/LEEWAY-DEVICE-BRIDGE** — canonical Android package, phone-local model/runtime, relay, device providers, receipts, and owner stop.
- **4citeB4U/LeeWay-Agent-Skills** — Agent Lee governance, 238-skill promotion authority, task-scoped skill retrieval, and capability manifold.
- **4citeB4U/Leeway-formula-live** — centralized Formula authority and consumer contract.

LeeWay Live consumes these authorities. It does not replace or duplicate them.

## Pages installer

The Pages UI reads the Device Bridge package manifest at runtime and resolves the highest current Android package by version code.

It displays:

- package version
- package size
- package SHA-256
- direct GitHub Pages download action

This prevents the installer from drifting when a new package is promoted.

## Current model paths

LeeWay Live preserves the current model router:

1. authorized local LeeWay Ollama runtime when reachable,
2. browser-local Transformers.js fallback,
3. native Android package as the phone execution authority.

The browser path is diagnostic/fallback capability. The downloaded Android package is the native phone authority.

## Sensory harness promotion

The Device Bridge repository contains a staged v0.8 sensory-harness branch adding:

- owner-initiated microphone input
- on-device speech recognition preference when Android exposes it
- Android TextToSpeech
- owner-initiated camera capture
- bundled phone-local ML Kit image labeling
- local model reasoning over speech and visual labels
- governed `sensory.status` and `sensory.speak` relay capabilities

v0.8 is not published until an APK is built, hashed, placed in the Pages package set, installed, and physically verified.

## Evidence law

Configured != executed.  
Available != authorized.  
Downloaded != installed.  
Installed != verified.  
Repository binding != capability execution.  
Formula health != Formula execution.  
Pages deployed != phone runtime proven.
