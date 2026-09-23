# LeeWay Live — Device-Local HTTP Runtime v1

## MASTER CHECKPOINT
LeeWay Live delivers governed runtime manifests, model/skill/voice capsules, and evidence through GitHub Pages. Heavy inference executes on the user's device behind a local HTTP control plane.

## Core law
Pages != inference host.
Device-local HTTP runtime = execution host.
Formula decision != runtime execution.
Configured != executed != verified.

## Target topology

```text
GitHub Pages / releases
  -> bootstrap manifest
  -> device passport
  -> Formula Funnel policy
  -> runtime/model/skill/voice capsule selection
  -> device-local install/reconstruction
  -> loopback HTTP runtime
       /health
       /v1/device/passport
       /v1/runtime/status
       /v1/model/status
       /v1/voice/profiles
       /v1/voice/stream
       /v1/voice/streams/{id}
       /v1/voice/streams/{id}/cancel
       /v1/vision/status
       /v1/vision/analyze
       /v1/receipts/latest
  -> local UI / PWA control
```

## Platform adapters
- Android/Termux: bash + Python/native binaries where qualified.
- Android native APK: LiteRT/AI Edge, AudioRecord/AudioTrack, CameraX, Room/SQLite.
- Windows/Linux: equivalent loopback HTTP adapter.
- Pages may attempt loopback discovery, but execution must remain local and independent after install.

## HTTP bridge rules
- Bind to 127.0.0.1 by default.
- Explicit CORS allowlist for the LeeWay Live Pages origin.
- Support Local Network Access / loopback permission where the browser implements it.
- Provide top-level local-runtime navigation as fallback when cross-origin loopback fetch is restricted.
- Never expose model runtime to 0.0.0.0 by default on consumer devices.
- All state-changing routes require local authorization/session tokens.

## Voice
Canonical identity is separate from synthesis engine.
Agent Lee voice identity:
- voiceId: LEEWAY_VOICE::AGENT_LEE::DEFAULT_CLONE
- speakerProfileId: LEEWAY_SPEAKER::LEONARD_J_LEE::AGENT_LEE

Provider candidates:
- XTTS-v2 HTTP adapter when device qualification passes.
- Future compact clone engines may be added only with speaker-fidelity and latency evidence.
- Android system/browser TTS is diagnostic/baseline only, never Agent Lee's canonical clone.

## Vision
Vision is a provider interface behind /v1/vision/*.
Provider selection is device-dependent:
- Gemma 3n / LiteRT where qualified.
- Qwen-VL-compatible local adapter where qualified.
- Other providers require capability and evidence contracts.

## Device Passport
Must capture:
- OS/API level
- architecture
- RAM/storage
- CPU/GPU/NPU/Vulkan
- battery/thermal state
- microphone/camera/audio route capability
- available runtimes
- available model formats
- network/install state

## Formula Funnel
The Formula Funnel consumes the Device Passport plus task/runtime requirements and selects a bounded execution profile. The current canonical Formula v1 historical 16x6 kernel is not to be misrepresented as a generic runtime selector unless a verified adapter is exposed for this decision class.

## Model capsule
Pages/release artifacts may distribute:
- deterministic shards
- reconstruction manifest
- model SHA-256
- runtime requirements
- skill bundle
- tool allowlist
- voice profile
- database schema
- receipts

The device reconstructs and verifies before load.

## Acceptance
A platform adapter is promoted only after:
1. install
2. hash verification
3. model load
4. voice/vision execution
5. HTTP integration
6. offline test
7. thermal/long-session test
8. Veritas receipt
