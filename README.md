# LeeWay Live

Standalone LeeWay real-time voice and small-model laboratory.

## Canonical purpose
This repository is the independent execution/test surface for the LeeWay voice stack. It is intentionally separate from LeeWay-Agent-Skills.

## Voice architecture included
- Frontier Voice Architecture Selector
- Universal Voice Bus
- Acoustic Coprocessor Fabric
- Real-Time Voice & Multimodal Infrastructure
- Formula Funnel findings and candidate math
- Full-duplex interruption / generation epochs / playout evidence
- Browser and provider adapters

## Model profiles
- Preferred Microsoft profile: microsoft/Phi-4-mini-instruct (3.8B; provider/local-runtime adapter)
- Browser-local fallback: HuggingFaceTB/SmolLM2-1.7B-Instruct
- Optional Qwen fallback: Qwen/Qwen2.5-1.5B-Instruct

## GitHub Pages
The `docs/` directory is the deployable UI. Pages hosts the static app; it does not itself provide a persistent server-side LLM runtime.

## Evidence law
Configured != executed. Model selected != model loaded. Microphone permission != usable transcription. Speech queued != audio heard. Pages deployed != full LeeWay runtime proven.
