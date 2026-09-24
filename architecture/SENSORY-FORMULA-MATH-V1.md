# LeeWay Sensory Harness — Formula Runtime & Storage Mathematics

## Authority boundary

This document binds the sensory harness to the existing centralized `LEEWAY-FORMULA-v1.0` authority.

It does **not** create a new Formula engine.

The current Formula authority state is:

```text
RECOVERED_IDENTITY_PENDING_HOST_REVERIFICATION
```

Therefore Formula-derived execution claims remain evidence-gated.

## 1. Installed-footprint baseline

Measured published Android package:

[
P_{apk}=65,869,689 bytes
]

Measured phone-local model:

[
P_{model}=373,719,040 bytes
]

Core installed footprint:

[
P_{core}=P_{apk}+P_{model}
]

[
P_{core}=439,588,729 bytes
]

[
P_{core}approx419.22 MiB
]

Thus:

[
P_{core}<1 GiB
]

before transient caches and runtime working-set growth.

This means the sensory system is already within the sub-1-GB installed-core target. The optimization problem is now separated into:

[
P_{total}=P_{core}+P_{cache}+P_{session}+P_{evidence}+P_{temp}
]

and runtime memory:

[
M_{runtime}=M_{model}+M_{KV}+M_{audio}+M_{vision}+M_{queues}+M_{temp}
]

Installed storage and runtime memory are not treated as the same metric.

## 2. Audio frame geometry

From the qualified LeeWay realtime-voice math:

[
N=F_sDelta t
]

where:

- (N) = samples per frame
- (F_s) = sample rate in samples/second
- (Delta t) = frame duration in seconds

PCM byte demand:

[
B_{frame}=Nleft(rac{B}{8}ight)C
]

where (B) is bit depth and (C) is channel count.

Known qualified vectors:

[
16kHz	imes20ms=320 samples
]

[
24kHz	imes20ms=480 samples
]

[
48kHz	imes20ms=960 samples
]

For mono 16-bit 48 kHz / 20 ms:

[
B_{frame}=960	imes2	imes1=1920 bytes
]

At 50 frames/second:

[
B_{raw/sec}=1920	imes50=96,000 bytes/s
]

This is why continuous raw PCM should not be retained as historical storage unless required by authority/evidence.

## 3. Behavioral audio representation

Measured Fold6 speech results for 24 kb/s Opus produced:

[
Reductionin[82.206%,89.09%]
]

with measured SDR values around 16.87–19.09 dB on the validated samples.

This is **not** permission to globally replace originals.

Formula policy is:

[
MediaType	o ContentState	o Formula	o Codec/QualityPolicy
]

not:

[
Everything	o OneCompressor
]

## 4. Q69 state geometry

Canonical normalized state:

[
hoin[0,1]
]

[
Q_{69}(ho)=clamp(round(69ho),0,69)
]

Reconstruction:

[
hatho=rac{Q_{69}(ho)}{69}
]

Quantization error bound:

[
epsilon_qlerac1{138}
]

The sensory runtime uses six telemetry dimensions per controller state:

[
mathbf q_t=[q_{t,1},...,q_{t,6}]
]

and the canonical 16-step geometry:

[
W_tinmathbb Z^{16	imes6}
]

Thus each controller operates over a rectangular state lattice of:

[
16	imes6=96
]

Q69-valued observations.

This geometry is used for runtime policy state, not as a claim that audio/video samples themselves should be encoded as Q69.

## 5. Controller geometry

For a node:

[
H_n(t)=[CPU,RAM,Disk,Network,Process,Queue]
]

Quantized:

[
Q_n(t)=[
Q_{69}(CPU),
Q_{69}(RAM),
Q_{69}(Disk),
Q_{69}(Network),
Q_{69}(Process),
Q_{69}(Queue)]
]

History:

[
W_n(t)=[Q_n(t-15),...,Q_n(t)]
]

Formula controller:

[
LW-H1(n,t)=LW-F1(W_n(t))
]

This becomes the runtime control surface for:

- queue/buffer pressure
- model residency
- cache retention
- thread budget
- media sampling/quality profile
- degradation/recovery decisions

## 6. Critical-path latency

The correct onset model is:

[
T_{response}=critical_path(
T_{network},
T_{endpoint},
T_{STT},
T_{LLM,TTFT},
T_{chunk},
T_{TTS,TTFB},
T_{playout})
]

Stages that overlap are not blindly summed.

This lets Formula optimize the actual dependency graph rather than an inaccurate scalar total.

## 7. Realtime factor

[
RTF=rac{T_{synthesis}}{T_{audio}}
]

Interpretation:

[
RTF<1Rightarrow faster than realtime
]

[
RTF=1Rightarrow realtime
]

[
RTF>1Rightarrow slower than realtime
]

Local production margin:

[
M_i=T_{audio,i}-T_{synthesis,i}
]

Positive margin is useful but does not alone prove underrun-free playout because jitter, dwell, backpressure and queue behavior still matter.

## 8. Queue geometry

Stable average queue relation:

[
L=lambda W
]

Queue saturation:

[
ho_Q=rac{lambda}{mu}
]

where (lambda) is arrival rate and (mu) is service rate.

LeeWay does not use Little's Law as a transient flush identity.

Every queue remains bounded.

## 9. Barge-in geometry

Measured spill model:

[
T_{spill}approx
T_{detect}+T_{flush}+T_{uninterruptible}
]

On interruption, the generation epoch changes:

[
e_{new}>e_{old}
]

and every event with:

[
e_{event}
e e_{active}
]

is rejected.

That gives a geometric separation between the valid trajectory and stale response trajectories.

## 10. Acoustic energy

Short-time energy:

[
STE=sum_n w[n]x[n]^2
]

RMS:

[
RMS=sqrt{rac1Nsum_nx[n]^2}
]

dBFS:

[
dBFS=20log_{10}left(rac{RMS}{x_{max}}ight)
]

These are features for endpoint/VAD policy, not universal speech decisions.

## 11. Vision sampling geometry

The existing LeeWay rule is:

[
sampleiff
semanticChangege	heta
lor taskTrigger
]

The control surface is therefore sparse in stable scenes and denser near task-relevant transitions.

This is the correct route to lower compute/storage than continuously storing every camera frame.

## 12. Storage state equations

Object segmentation:

[
mathcal C(O)={C_1,...,C_m}
]

Chunk identity:

[
q_i=SHA256(C_i)
]

Unique-byte demand:

[
U(O)=sum_i u_i|C_i|
]

with:

[
u_i=
egin{cases}
0,&q_iinmathcal K\
1,&q_i
otinmathcal K
end{cases}
]

Source Acquisition Factor:

[
SAF=rac{P_{new}}{L(O)}
]

Acquisition amplification:

[
SAFA=rac{L(O)}{P_{new}}
]

Exactness gates:

[
|O'|=|O|
]

[
SHA256(O')=SHA256(O)
]

[
O'=O
]

For behavioral media representations, exact byte equality is not required, but perceptual/semantic acceptance is.

## 13. Runtime versus storage optimization

The Formula policy treats these as independent axes:

[
mathbf J=
[
Storage,
RAM,
VRAM,
Latency,
Bandwidth,
Queue,
Quality,
Authority
]
]

There is no valid rule of the form:

[
StorageReductionRightarrow RuntimeReduction
]

or:

[
VRAMReductionRightarrow ModelCompression
]

because existing LeeWay experiments already disproved those generalizations.

The measured GPU working-set campaign achieved:

[
11.18	imes
]

VRAM working-set reduction in its qualified scope, but that is not total-model compression.

## 14. Formula-controlled sensory policy

The runtime control loop is:

```text
raw telemetry
→ normalized rho
→ Q69
→ 16x6 controller history
→ centralized Formula authority
→ bounded policy decision
→ media/runtime/storage action
→ measurement
→ Veritas
→ receipt
```

Formula may select among already-qualified policy choices.

Formula may not convert an unqualified codec, threshold or compression target into a verified result by declaration.

## 15. Objective

The engineering objective is not “make everything as small as possible.”

It is:

[
min
left[
P_{total},
M_{runtime},
T_{response},
BW,
QueuePressure
ight]
]

subject to:

[
Qualityge Q_{min}
]

[
Authority=PASS
]

[
Veritas=PASS
]

[
Reconstructability/Fidelity=PASS
]

That is the LeeWay optimization boundary for the sensory harness.
