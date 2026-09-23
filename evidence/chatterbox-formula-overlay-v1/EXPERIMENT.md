# LeeWay Chatterbox Formula Overlay v1

## Experiment law

The Chatterbox model, model weights, Agent Lee reference audio, text prompt, and
sampling parameters remain unchanged between the native-control and LeeWay-controlled arms.

The LeeWay layer may govern only runtime/execution behavior:

- CPU/GPU route selection when qualified
- thread and stream count
- model residency
- speaker-conditioning reuse
- bounded segment size
- queue depth
- RAM/VRAM reserve policy
- telemetry and receipts

It must not rewrite Chatterbox model mathematics and then attribute that change to the
Formula layer.

## Native-control arm

- Chatterbox's ordinary generation path
- default torch thread policy
- reference conditioning performed inside each request
- same model loaded once for the test

## LeeWay-controlled candidate arm

Input: measured hardware telemetry plus a LeeWay Compute Fabric control plan.

Current candidate policy:

- controller authority: candidate/unpromoted until hash drift is reconciled
- Formula v1 historical 16x6 object is **not** used as a generic selector
- CAPACITY_SAFE profile when measured headroom produces that controller state
- one stream
- persistent model residency
- Agent Lee conditionals prepared once and reused
- bounded 72-character segments for the streaming experiment
- bounded queue depth 1

## Acceptance measurements

Same prompt and reference audio:

- model load time
- conditioning time
- first generation time
- repeated generation time
- audio duration
- real-time factor
- process RSS peak
- CPU utilization
- optional CUDA/VRAM when the runtime qualifies it
- first playable segment latency
- cancellation spill
- speaker-identity similarity
- output correctness

## Evidence boundary

A faster LeeWay-controlled run proves a runtime-control improvement only.
It does not prove that LeeWay Formula altered or improved Chatterbox's neural model.
