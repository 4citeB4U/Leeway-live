# LeeWay Universal Sensory Harness v1

## MASTER CHECKPOINT

LeeWay Live is a **device-agnostic sensory transport and orchestration layer** for models.

The sensory harness is not tied to one Android build, one browser, one LLM provider, or one speech architecture.

The stable abstraction is a realtime session.

```text
ANY DEVICE
phone / tablet / desktop / laptop / browser / native app
        ↓
microphone / camera / screen / speaker
        ↓
LiveKit WebRTC room
        ↓
LEEWAY UNIVERSAL SENSORY HARNESS
        ↓
Universal Voice Bus + Control Plane + Evidence Plane
        ↓
MODEL ADAPTER
        ↓
ANY AUTHORIZED MODEL
```

## Canonical authority

This implementation is subordinate to the existing LeeWay Agent Skills:

- `config/universal-voice-bus-v1.json`
- `config/realtime-voice-execution-contract-v1.json`
- `config/realtime-voice-multimodal-profile-v1.json`
- `config/realtime-voice-heavy-use-routing-v1.json`
- `skills/leeway-frontier-voice-architecture-selector/SKILL.md`
- `skills/leeway-real-time-voice-multimodal-infrastructure/SKILL.md`

No provider may redefine LeeWay authority.

## Core law

**Devices publish senses. Models consume senses. LeeWay owns the contract between them.**

A model does not need device-specific code.

A device does not need model-specific code.

The LeeWay harness negotiates capabilities between both.

## Runtime planes

### Media Plane

Continuous realtime media:

- microphone audio track
- camera video track
- screen-share video track
- model/agent audio output track
- optional model/agent video output track
- RTP/SRTP media transport through WebRTC
- codec negotiation
- AEC/noise suppression/gain control where available
- jitter and packet-loss handling

### Control Plane

Session and realtime control:

- connect / disconnect / reconnect
- model attach / detach
- capability negotiation
- LISTENING
- USER_SPEAKING
- ENDPOINT_PENDING
- AGENT_THINKING
- AGENT_SPEAKING
- INTERRUPTING
- RECOVERING
- generation epoch
- cancellation
- bounded queues
- backpressure
- route changes
- device changes
- stale output rejection

### Cognitive Plane

Selected by the Frontier Voice Architecture Selector.

#### Architecture A — Cascaded

```text
audio
→ VAD / endpointing
→ streaming STT
→ arbitrary text LLM
→ streaming TTS
→ audio track
```

Use when the attached model consumes text rather than native audio.

#### Architecture B — Native speech-to-speech

```text
audio track
→ realtime multimodal model
→ native audio stream
→ audio track
```

Use when the attached model exposes verified native realtime speech capability.

#### Architecture C — Half-cascade

```text
audio
→ realtime speech-understanding model
→ semantic/text output
→ selected LeeWay TTS
→ audio track
```

Use when native acoustic understanding is useful but LeeWay controls the output voice.

### Vision path

The device publishes camera and/or screen-share tracks.

The harness negotiates the attached model's visual capabilities.

```text
camera/screen WebRTC track
        ↓
capability negotiation
        ├─ native live-video model → live frames
        ├─ image-capable model → adaptive semantic keyframes
        └─ text-only model → LeeWay vision adapter → semantic events/text
```

Audio and vision clocks remain independent.

Vision sampling is adaptive and task-aware.

## Model attachment contract

Every model adapter SHALL implement the LeeWay Model Sensory Contract.

The model receives a stable session interface regardless of provider or device.

Required adapter lifecycle:

1. identify model/provider/runtime
2. declare capabilities
3. join authorized LeeWay session
4. negotiate media representations
5. consume supported sensory streams
6. emit responses/events
7. implement cancellation semantics
8. preserve generation epochs
9. expose health and latency telemetry
10. return evidence

A model adapter must never claim a modality it cannot actually consume or produce.

## Adapter classes

### NativeRealtimeAdapter

For models that directly consume realtime audio and optionally video.

Examples of capability shape:

```json
{
  "audioInput": "native_stream",
  "audioOutput": "native_stream",
  "videoInput": "live_or_sampled",
  "textInput": true,
  "textOutput": true,
  "bargeIn": true
}
```

### CascadedTextModelAdapter

For ordinary chat/completion models.

LeeWay supplies:

- streaming STT
- endpointing
- vision-to-semantic adapter
- prompt/context construction
- streaming TTS
- interruption/cancellation
- playout evidence

The text model only implements text generation.

### LocalModelAdapter

For Ollama, llama.cpp, LiteRT, local OpenAI-compatible runtimes, or other device-hosted models.

The adapter may execute on the same device as the media source or remotely.

Location does not change the LeeWay sensory contract.

## Universal Voice Bus mapping

The existing `LEEWAY_UNIVERSAL_VOICE_BUS_V1` is carried over LiveKit media/data channels.

Required envelope fields:

- sessionId
- eventId
- eventType
- monotonicTimestamp
- generationEpoch
- source
- provenance

Supported representations include:

- TEXT_DELTA
- CONTROL_CANCEL
- CONTROL_END
- ERROR
- TOKEN_LOGPROBS
- SEMANTIC_EVENT
- TOOL_EVENT
- PHONEME_EVENT
- PROSODY_EVENT
- AUDIO_EMBEDDING
- AUDIO_CODEC_UNIT
- NATIVE_AUDIO_CHUNK
- VISION_EVENT
- CONFIDENCE_EVENT

Media itself uses WebRTC tracks.

Control/evidence events use LiveKit data, RPC, state synchronization, or text streams as appropriate.

## LiveKit role

LiveKit is the realtime transport/runtime substrate, not LeeWay authority.

Use LiveKit for:

- rooms
- WebRTC transport
- microphone tracks
- camera tracks
- screen-share tracks
- audio output tracks
- participant lifecycle
- reconnect
- track subscription
- RPC
- state synchronization
- text streams
- data packets

LeeWay remains responsible for:

- model capability negotiation
- provider abstraction
- Formula/governance gates
- turn state
- interruption epochs
- playout ledger
- context
- privacy authority
- evidence
- receipts
- recovery policy

## Device-agnostic client contract

A frontend implementation needs only:

1. a LiveKit session token
2. the LeeWay room/session identifier
3. media permissions granted by the operating system/user
4. the standard LeeWay session metadata

No model-specific configuration belongs in the device client.

Client implementations may use:

- Web
- Android
- iOS / Swift
- React Native
- Flutter
- desktop/native wrappers
- future LiveKit-compatible endpoints

## Model-agnostic rule

The model does not know or care whether the user's microphone came from:

- Samsung Fold
- Android tablet
- Windows laptop
- macOS desktop
- iPhone
- browser
- native app

The model consumes the LeeWay session.

Likewise, the client does not know or care whether the model is:

- local LiteRT
- Ollama
- llama.cpp
- OpenAI-compatible
- native realtime speech model
- cloud LLM
- future model

The client publishes senses.

## Full-duplex requirements

Stage completion requires:

- continuous microphone streaming
- continuous agent audio streaming
- deterministic barge-in
- cancellation propagation
- playout flush
- stale generation rejection
- bounded queues
- AEC/feedback strategy
- connection recovery
- latency telemetry
- rendered-audio ledger

Push-to-talk is a fallback profile, not the target architecture.

## Vision requirements

Stage completion requires:

- camera publishing
- screen-share publishing where supported
- model capability detection
- live video for capable realtime models
- adaptive semantic frame sampling for image-capable models
- semantic vision adapter for text-only models
- bounded frame rate / bandwidth
- vision provenance
- visual event timing

## Evidence requirements

At minimum record:

- provider identity
- model identity
- device/network profile
- connection state
- media track state
- packet loss/jitter context
- STT first/final latency
- LLM TTFT
- TTS TTFB
- interruption spill
- queue occupancy
- generation epoch
- playout ledger
- visual sampling state
- reconnect trace
- privacy authority state

## Acceptance statement

LeeWay Universal Sensory Harness is complete only when:

```text
arbitrary supported device
        ↓
publishes live mic + camera/screen
        ↓
arbitrary authorized model adapter joins
        ↓
model receives live audio/vision
        ↓
model returns streamed response
        ↓
user hears response
        ↓
user can interrupt it
        ↓
session recovers/reconnects
        ↓
evidence proves the complete path
```

No device-specific success may be generalized to all devices without capability evidence.
