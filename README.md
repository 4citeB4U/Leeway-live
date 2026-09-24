# LeeWay Live

LeeWay Live is the GitHub Pages front door for the LeeWay phone sensory harness.

## Canonical purpose

A user should be able to open LeeWay Live from GitHub Pages, discover the current authorized Android package, download it, install it on the phone, and run LeeWay locally without requiring a PC.

GitHub Pages distributes. The phone executes.

## Authority map

- **LeeWay Live** — public bootstrap, installer, status, diagnostics, and sensory-harness entrypoint.
- **LEEWAY-DEVICE-BRIDGE** — canonical Android package, phone-local execution, remote relay, device providers, receipts, and owner stop.
- **LeeWay-Agent-Skills** — Agent Lee governance and capability authority.
- **Leeway-formula-live** — centralized Formula authority and consumer contract.

LeeWay Live consumes those authorities. It does not copy or replace them.

## Current published phone runtime

The installer dynamically reads the canonical Device Bridge package manifest. As of the current manifest, the published Android package is v0.7.0.

The v0.7 runtime already contains:

- phone-local LiteRT model install / hash verification / inference
- owner-controlled local bridge
- permanent outbound relay
- Formula F8 command gate
- device discovery/providers
- receipts
- boot restart / auto-reconnect support

## Sensory harness promotion

The next Android source version, v0.8.0, is staged in the Device Bridge repository to add:

- owner-initiated microphone input
- Android speech recognition with on-device preference when available
- Android TextToSpeech output
- owner-initiated camera capture
- bundled phone-local ML Kit image labeling
- local model reasoning over recognized speech and visual labels
- governed `sensory.status` and `sensory.speak` relay capabilities

v0.8 must not be called published until an APK is built, hashed, promoted to the package manifest, installed, and physically verified.

## Browser diagnostics

The Pages UI also contains optional browser voice, camera, and local-model diagnostics. These are not the canonical native phone runtime.

## Evidence law

Configured != executed.  
Available != authorized.  
Downloaded != installed.  
Installed != verified.  
Pages deployed != phone runtime proven.  
Model output != receipt.
