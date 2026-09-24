# LeeWay Universal Sensory Harness v1

## MASTER CHECKPOINT

LeeWay Live is a **device-agnostic, model-agnostic sensory fabric** owned by LeeWay.

No paid third-party realtime service is required.
No external realtime API key is required.
No model is coupled to one phone, browser, desktop, or operating system.

The architecture is derived from the already-admitted LeeWay Agent Skills contracts:

- Universal Voice Bus
- Real-Time Voice Execution Contract
- Real-Time Voice Multimodal Profile
- Frontier Voice Architecture Selector
- Real-Time Voice & Multimodal Infrastructure
- Formula Tunnel

## Canonical path

```text
DEVICE CAPABILITIES
mic / speaker / camera / screen
        ↓
LEEWAY MEDIA ADAPTER
        ↓
native WebRTC/RTP media
        ↓
LEEWAY SESSION FABRIC
        ↓
Universal Voice Bus
+ Control Plane
+ Evidence Plane
+ Formula Policy
        ↓
MODEL ADAPTER
        ↓
AUTHORIZED MODEL
```

The transport implementation is replaceable.
The LeeWay sensory contract is not.

## Zero-service law

The production sensory path SHALL NOT require:

- paid realtime-service subscriptions
- third-party realtime API keys
- hosted proprietary media authority
- model-provider-specific device SDKs

Permitted runtime classes are:

1. browser/OS native facilities,
2. LeeWay-owned code,
3. self-hosted open-source components with no service dependency,
4. local models/runtimes,
5. optional model providers only when separately authorized by the owner.

A free/open library may donate implementation capability but never becomes LeeWay authority.

## Four-plane architecture

### Media Plane

Continuous realtime media:

- microphone audio
- agent speech/audio
- camera video
- screen video
- optional data representations such as encoded audio units

Primary interactive transport:

```text
WebRTC / RTP / SRTP
```

LeeWay uses browser/OS-native WebRTC where available.

Media responsibilities:

- capture
- framing
- timestamping
- AEC / NS / AGC where applicable
- codec negotiation
- packetization
- jitter handling
- bounded buffers
- playout
- video frame timing

### Control Plane

LeeWay-owned control/signaling channel:

- session create/join
- peer identity
- SDP offer/answer exchange
- ICE candidate exchange
- capability negotiation
- generation epochs
- barge-in / cancellation
- backpressure
- reconnect
- model attach/detach
- route changes
- owner authority
- receipts/evidence references

Control MAY use a LeeWay-owned WebSocket endpoint because control traffic and media traffic are separate concerns.

The existing LeeWay relay can be extended for signaling without becoming media authority.

### Cognitive Plane

The Frontier Voice Architecture Selector chooses the best verified path.

#### A — Cascaded

```text
audio
→ VAD / endpointing
→ streaming STT
→ text/model stream
→ streaming TTS
→ playout
```

#### B — Native speech-to-speech

```text
audio representation
→ native realtime multimodal model
→ native audio representation
→ playout
```

#### C — Continuous-state research

CGSS/continuous acoustic representations remain Formula Factory research only until independently qualified.

### Evidence Plane

Every session preserves:

- monotonic timestamps
- session ID
- event ID
- generation epoch
- source
- provenance
- device profile
- model/provider identity
- media state
- queue state
- jitter/loss context
- latency spans
- interruption trace
- Formula profile
- privacy authority
- playout ledger
- receipt references

## Universal Voice Bus

The existing `LEEWAY_UNIVERSAL_VOICE_BUS_V1` is the canonical event protocol.

Required envelope:

```text
sessionId
eventId
eventType
monotonicTimestamp
generationEpoch
source
provenance
```

Minimum event classes:

```text
TEXT_DELTA
CONTROL_CANCEL
CONTROL_END
ERROR
```

Optional negotiated event classes:

```text
TOKEN_LOGPROBS
SEMANTIC_EVENT
TOOL_EVENT
PHONEME_EVENT
PROSODY_EVENT
AUDIO_EMBEDDING
AUDIO_CODEC_UNIT
NATIVE_AUDIO_CHUNK
VISION_EVENT
CONFIDENCE_EVENT
```

Never assume an optional representation exists.

## Model attachment law

A model is attached to a LeeWay sensory session, not to a specific physical device.

Every model adapter declares:

```text
inputCapabilities
outputCapabilities
cancelSemantics
timingSemantics
providerModelIdentity
```

The adapter SHALL also expose:

- adapter ID/version
- runtime location
- streaming input support
- streaming output support
- audio input mode
- audio output mode
- vision mode
- text mode
- cancellation support
- health
- telemetry

## Model classes

### NativeRealtimeAdapter

For a model that consumes/produces native streaming audio and possibly video.

```text
WebRTC media
→ representation adapter if needed
→ model
→ streamed media
```

### CascadedTextModelAdapter

For any ordinary text LLM.

LeeWay supplies:

```text
audio → STT → model → TTS → audio
video → semantic/keyframe adapter → model
```

The model itself requires no microphone/camera code.

### LocalModelAdapter

For local runtime targets such as:

- LiteRT
- Ollama
- llama.cpp
- OpenAI-compatible local endpoint
- other authorized local inference runtime

The model may run on the same device or a different device.
The sensory contract does not change.

## Device classes

A device only implements capability adapters.

Possible participants:

- Samsung / Android phone
- Android tablet
- Windows
- Linux
- macOS
- browser
- iPhone / iPad
- native desktop wrapper
- future device exposing compatible media primitives

A device advertises what exists:

```json
{
  "microphone": true,
  "speaker": true,
  "camera": true,
  "screenCapture": true,
  "webrtc": true
}
```

The model never needs device-specific knowledge.

## Session signaling

LeeWay signaling carries only session/control metadata.

Example flow:

```text
DEVICE
  | SESSION_HELLO
  v
LEEWAY SIGNALING
  | CAPABILITY_NEGOTIATION
  v
MODEL ADAPTER
  | SDP_OFFER / SDP_ANSWER
  | ICE_CANDIDATE
  v
DIRECT/SELF-HOSTED WEBRTC MEDIA
```

Signaling does not carry raw media unless the selected fallback profile explicitly requires it.

## NAT traversal

The architecture supports:

1. direct host/LAN candidates,
2. direct peer-reflexive paths where available,
3. owner-operated/self-hosted STUN/TURN if required.

No proprietary hosted TURN dependency is part of the canonical system.

If relay infrastructure is required and no acceptable free/open self-hosted implementation exists, LeeWay builds the missing component.

## Full-duplex law

Push-to-talk is a fallback profile.

The target state machine is:

```text
LISTENING
USER_SPEAKING
ENDPOINT_PENDING
AGENT_THINKING
AGENT_SPEAKING
INTERRUPTING
RECOVERING
```

On valid barge-in:

1. invalidate current generation epoch,
2. flush local interruptible playout,
3. send CONTROL_CANCEL,
4. cancel upstream generation/TTS where supported,
5. discard stale epoch events,
6. preserve only evidence-backed rendered content,
7. return to LISTENING.

## Vision law

Camera/screen media are continuous sources.

The Formula policy controls semantic sampling.

```text
sample iff semantic_change_score >= theta OR task_trigger
```

Stable scenes reduce sampling.
Scene change, motion, OCR/UI change, pointing, task relevance, or explicit user request may increase sampling.

Native-video models may consume a live negotiated stream.
Image-capable models receive adaptive keyframes.
Text-only models receive semantic vision events/text.

## Formula integration

Raw runtime telemetry is normalized and quantized through the canonical LeeWay Formula authority.

```text
raw telemetry
→ rho in [0,1]
→ Q69
→ 16x6 history
→ centralized Formula authority
→ bounded policy
→ media/runtime/storage action
→ measurement
→ Veritas
→ receipt
```

Formula controls qualified policy choices such as:

- audio frame duration
- jitter buffer
- queue capacity
- codec profile
- VAD/endpointer profile
- speech chunk size
- model residency
- context budget
- vision sampling
- media resolution
- cache retention
- exact vs behavioral representation

Formula does not turn an unverified codec or threshold into a verified result.

## Storage law

Do not store continuous raw sensory media by default.

Working media is ephemeral unless authority requires retention.

Use the existing LeeWay storage equations for:

- chunk identity
- dedupe
- unique-byte demand
- reconstruction
- acquisition factor
- fidelity/exactness gates

The system distinguishes:

```text
installed footprint
runtime RAM/VRAM
network bandwidth
session buffers
persistent evidence
retained media
```

These are different optimization axes.

## Completion gate

The harness is complete only when:

```text
arbitrary supported device
→ publishes live voice + live vision
→ arbitrary authorized model adapter attaches
→ negotiated representation flows
→ model responds continuously
→ user receives streamed speech/output
→ user interrupts
→ stale work is rejected
→ session reconnects
→ Formula policy adapts runtime
→ evidence proves every stage
```

Configured != executed.
Streaming != low latency.
Transport connected != healthy.
Audio rendered != human heard.
Model output != proof.
