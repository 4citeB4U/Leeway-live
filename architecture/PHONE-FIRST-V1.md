# LeeWay Live — Phone-First Architecture v1

## MASTER CHECKPOINT
LeeWay Live is an Android-first, offline-capable voice + vision agent. GitHub Pages is its public/install/diagnostic companion. The APK is the execution runtime.

## Canonical v1 stack
- Brain / multimodal: Gemma 3n E2B through Google AI Edge/LiteRT MediaPipe on Android.
- Text fallback: Qwen3 1.7B quantized through llama.cpp Android only if the Gemma profile fails the device acceptance gate or a text-specialized profile is useful.
- Audio capture/playout: Android AudioRecord / AudioTrack.
- V1 turn-taking: push-to-talk.
- Speech output proof: Android offline TextToSpeech.
- Controlled offline voice: Sherpa-ONNX compact TTS after baseline.
- VAD/full duplex: Sherpa-ONNX VAD after push-to-talk passes.
- Audio understanding/STT: Gemma 3n audio where supported; dedicated Sherpa-ONNX/Qwen3-ASR fallback where required.
- Vision: Gemma 3n image/video input with semantic frame sampling.
- Memory: Room/SQLite.
- Tools: explicit Kotlin allowlist.
- Skills: compact LeeWay skill retrieval bundle; never dump hundreds of skills into context.
- Evidence: Universal Voice Bus events + generation epochs + receipts.

## Execution path
MIC/CAMERA
  -> Android media adapters
  -> push-to-talk / semantic frame sampler
  -> Gemma 3n E2B
  -> LeeWay skill retrieval / tool proposal
  -> allowlist + human authority gate
  -> response
  -> offline TTS
  -> AudioTrack
  -> receipt

## Why Gemma 3n E2B
It is the primary profile because it is engineered for on-device multimodal use and covers text, image/video and audio understanding. This reduces duplicated inference stacks on a phone.

## Why Qwen3 1.7B remains optional
Qwen3 1.7B has a viable Android llama.cpp path and is small enough to be a useful text fallback. It is not the primary multimodal engine.

## What GitHub Pages does
- project dashboard
- APK/release link
- device capability checklist
- architecture/evidence status
- test instructions
- receipts
- optional lightweight browser diagnostics

Pages does NOT claim to run the native Android Gemma/Sherpa stack.

## Build gates
G0 Pages UI
G1 Android shell
G2 Device Passport
G3 Model install/load
G4 Text inference
G5 Push-to-talk
G6 Spoken response
G7 Interrupt
G8 Vision
G9 Skill retrieval
G10 Airplane-mode proof
G11 Thermal/long-session
G12 Veritas/receipt
