# LeeWay Model Capsule Candidate Simulation v1

Status: **PASS — candidate simulation, not canonical Formula proof**

A 64 MiB synthetic GGUF-like transport artifact was tested with 16 deterministic shards and byte-exact reconstruction.

| Control | Original | Capsule | Reduction | Ratio | SHA-256 reconstruction |
|---|---:|---:|---:|---:|---|
| High-entropy random | 64.00 MiB | 64.02 MiB | -0.03% | 1.00x | PASS |
| Structured quantized-weight-like | 64.00 MiB | 41.13 MiB | 35.74% | 1.56x | PASS |

The negative control is important: the method did not fabricate compression on incompressible bytes. The structured artifact compressed materially and reconstructed exactly.

Peak estimated working set for one structured reconstruction shard was ~6.57 MiB.

## Evidence boundary
This experiment does not claim canonical Formula execution, 16x compression, neural behavior preservation, or direct inference from the capsule. The next gate is a real quantized model artifact under the same protocol, followed by comparison against the canonical LeeWay Formula implementation.
