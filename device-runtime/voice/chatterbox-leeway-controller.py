#!/usr/bin/env python3
"""
LeeWay Chatterbox execution controller v1.

This module does not modify Chatterbox model math.
It applies an externally produced LeeWay compute-control plan to runtime
scheduling, conditioning reuse, residency, and bounded segmentation.
"""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
import json
import re
import time
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS

@dataclass(frozen=True)
class ComputePolicy:
    profile: str
    threads: int
    streams: int
    segment_chars: int
    queue_depth: int
    conditioning: str
    residency: str
    controller_hash: str
    controller_authority: str

    @classmethod
    def from_plan(cls, path: str | Path) -> "ComputePolicy":
        data = json.loads(Path(path).read_text(encoding="utf-8-sig"))
        p = data["leewayControlled"]
        return cls(
            profile=str(data["computeProfile"]["name"]),
            threads=int(p["threads"]),
            streams=int(p["streams"]),
            segment_chars=int(p["segmentChars"]),
            queue_depth=int(p["queueDepth"]),
            conditioning=str(p["conditioning"]),
            residency=str(p["residency"]),
            controller_hash=str(data["controllerHash"]),
            controller_authority=str(data["controllerAuthority"]),
        )

def split_text(text: str, max_chars: int) -> list[str]:
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    if not text:
        return []
    out, current = [], ""
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        for word in sentence.split():
            candidate = (current + " " + word).strip()
            if current and len(candidate) > max_chars:
                out.append(current)
                current = word
            else:
                current = candidate
        if current and sentence.endswith((".", "!", "?")):
            out.append(current)
            current = ""
    if current:
        out.append(current)
    return out

class LeeWayChatterboxController:
    def __init__(
        self,
        model_dir: str | Path,
        reference_audio: str | Path,
        policy: ComputePolicy,
        nano: bool = True,
        device: str = "cpu",
    ):
        self.model_dir = Path(model_dir)
        self.reference_audio = Path(reference_audio)
        self.policy = policy
        self.nano = nano
        self.device = device
        self.model = None
        self.model_load_seconds = None
        self.conditioning_seconds = None

    def load(self):
        torch.set_num_threads(max(1, self.policy.threads))
        started = time.perf_counter()
        self.model = ChatterboxTurboTTS.from_local(
            self.model_dir, device=self.device, nano=self.nano
        )
        self.model_load_seconds = time.perf_counter() - started
        if self.policy.conditioning == "PREPARE_ONCE_REUSE":
            started = time.perf_counter()
            self.model.prepare_conditionals(
                str(self.reference_audio),
                exaggeration=0.0,
                norm_loudness=True,
            )
            self.conditioning_seconds = time.perf_counter() - started
        return self

    def native_generate(self, text: str):
        if self.model is None:
            raise RuntimeError("MODEL_NOT_LOADED")
        started = time.perf_counter()
        wav = self.model.generate(text, audio_prompt_path=str(self.reference_audio))
        return wav, time.perf_counter() - started

    def controlled_generate(self, text: str):
        if self.model is None:
            raise RuntimeError("MODEL_NOT_LOADED")
        started = time.perf_counter()
        wav = self.model.generate(text, audio_prompt_path=None)
        return wav, time.perf_counter() - started

    def controlled_segments(self, text: str):
        if self.model is None:
            raise RuntimeError("MODEL_NOT_LOADED")
        for index, segment in enumerate(split_text(text, self.policy.segment_chars)):
            started = time.perf_counter()
            wav = self.model.generate(segment, audio_prompt_path=None)
            yield {
                "sequence": index,
                "text": segment,
                "generationSeconds": time.perf_counter() - started,
                "wav": wav,
            }
