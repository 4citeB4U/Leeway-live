#!/usr/bin/env python3
"""
LeeWay Live Chatterbox Nano HTTP provider v1.

This provider keeps Chatterbox model math unchanged. LeeWay controls the
execution envelope: residency, thread budget, conditioning reuse, bounded
segment transport, identity/evidence headers, and cancellation boundaries.

Authority boundary:
- Chatterbox Nano = synthesis model/provider.
- LeeWay Compute-Fabric binding = candidate runtime control plane.
- Canonical Formula v1 historical 16x6 object is NOT claimed as the generic
  workload selector.
"""
from __future__ import annotations
import hashlib, json, os, re, threading, time, uuid
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import numpy as np
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS

HOST=os.environ.get("LEEWAY_CHATTERBOX_HOST","127.0.0.1")
PORT=int(os.environ.get("LEEWAY_CHATTERBOX_PORT","8792"))
MODEL_DIR=Path(os.environ["LEEWAY_CHATTERBOX_MODEL_DIR"])
REFERENCE=Path(os.environ["LEEWAY_CHATTERBOX_REFERENCE"])
VOICE_ID=os.environ.get("LEEWAY_VOICE_ID","LEEWAY_VOICE::AGENT_LEE::DEFAULT_CLONE")
SPEAKER_ID=os.environ.get("LEEWAY_SPEAKER_PROFILE_ID","LEEWAY_SPEAKER::LEONARD_J_LEE::AGENT_LEE")
THREADS=int(os.environ.get("LEEWAY_CHATTERBOX_THREADS","8"))
PROFILE=os.environ.get("LEEWAY_CHATTERBOX_COMPUTE_PROFILE","CAPACITY_SAFE")
CONTROLLER_HASH=os.environ.get("LEEWAY_COMPUTE_CONTROLLER_HASH","054F73C8EFD8BCA3B1963D6EDA13F2A5AB0E12DA0C8EA6D6BBC2897552148080")
CONTROLLER_AUTHORITY=os.environ.get("LEEWAY_COMPUTE_CONTROLLER_AUTHORITY","CANDIDATE_UNPROMOTED_DRIFT_RECORDED")

def sha256(path: Path) -> str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""): h.update(block)
    return h.hexdigest()

REFERENCE_SHA=sha256(REFERENCE)
torch.set_num_threads(THREADS)
_load0=time.perf_counter()
MODEL=ChatterboxTurboTTS.from_local(MODEL_DIR,device="cpu",nano=True)
MODEL_LOAD_SECONDS=time.perf_counter()-_load0
_cond0=time.perf_counter()
MODEL.prepare_conditionals(str(REFERENCE),exaggeration=0.0,norm_loudness=True)
CONDITIONING_SECONDS=time.perf_counter()-_cond0
LOCK=threading.Lock()
STREAMS={}

def segments(text,max_chars=72):
    text=re.sub(r"\s+"," ",str(text or "")).strip()
    if not text:return []
    out=[]; cur=""
    for sentence in re.split(r"(?<=[.!?])\s+",text):
        for word in sentence.split():
            nxt=(cur+" "+word).strip()
            if cur and len(nxt)>max_chars:
                out.append(cur); cur=word
            else: cur=nxt
        if cur and sentence.endswith((".","!","?")):
            out.append(cur); cur=""
    if cur:out.append(cur)
    return out

def pcm16(wav):
    x=wav.detach().cpu().float().numpy().reshape(-1)
    return (np.clip(x,-1,1)*32767.0).astype("<i2").tobytes()

class Handler(BaseHTTPRequestHandler):
    def send_json(self,code,obj):
        raw=json.dumps(obj,separators=(",",":")).encode()
        self.send_response(code); self.send_header("Content-Type","application/json")
        self.send_header("Content-Length",str(len(raw))); self.send_header("Cache-Control","no-store")
        self.end_headers(); self.wfile.write(raw)
    def body(self):
        n=int(self.headers.get("Content-Length","0") or 0)
        return json.loads(self.rfile.read(n).decode() or "{}")
    def do_GET(self):
        p=self.path.split("?",1)[0]
        if p in ("/","/health"):
            return self.send_json(200,{
              "status":"healthy","provider":"chatterbox-nano-http",
              "modelLoadSeconds":round(MODEL_LOAD_SECONDS,3),
              "conditioningSeconds":round(CONDITIONING_SECONDS,3),
              "sampleRate":MODEL.sr,"computeProfile":PROFILE,"threads":THREADS,
              "computeControllerHash":CONTROLLER_HASH,"controllerAuthority":CONTROLLER_AUTHORITY
            })
        if p=="/voice-profiles":
            return self.send_json(200,{
              "schema":"leeway.voice-factory.registry.v1",
              "defaultVoiceId":VOICE_ID,
              "profiles":[{
                "voiceId":VOICE_ID,"agentId":"agent-lee","speakerProfileId":SPEAKER_ID,
                "referenceAudioSHA256":REFERENCE_SHA,"engine":"chatterbox-nano",
                "supportedLanguages":["en"],"defaultLanguage":"en","status":"ACTIVE_CANDIDATE",
                "streamingMode":"BOUNDED_SEGMENT","computeProfile":PROFILE,
                "computeControllerHash":CONTROLLER_HASH
              }]
            })
        if p.startswith("/streams/"):
            sid=p.split("/")[2]; state=STREAMS.get(sid)
            return self.send_json(200,state) if state else self.send_json(404,{"error":"STREAM_NOT_FOUND"})
        return self.send_json(404,{"error":"NOT_FOUND"})
    def do_POST(self):
        p=self.path.split("?",1)[0]
        if p=="/tts/stream":
            body=self.body(); text=str(body.get("text","")).strip(); lang=str(body.get("language","en"))
            if not text:return self.send_json(400,{"error":"TEXT_REQUIRED"})
            if lang!="en":return self.send_json(400,{"error":"LANGUAGE_NOT_SUPPORTED_BY_NANO","language":lang})
            sid="leeway-chatterbox-nano-"+str(uuid.uuid4())
            state={
              "streamId":sid,"status":"STARTING","voiceId":VOICE_ID,"speakerProfileId":SPEAKER_ID,
              "referenceAudioSHA256":REFERENCE_SHA,"engine":"chatterbox-nano","language":"en",
              "encoding":"pcm_s16le","sampleRate":MODEL.sr,"channels":1,
              "streamingMode":"BOUNDED_SEGMENT","computeProfile":PROFILE,
              "chunkCount":0,"audioBytes":0,"firstAudioLatencyMs":None,
              "cancelRequested":False,"cancelled":False,"startedAtEpochMs":int(time.time()*1000)
            }
            STREAMS[sid]=state
            self.send_response(200)
            headers={
              "Content-Type":"application/octet-stream","x-leeway-stream-id":sid,
              "x-leeway-voice-id":VOICE_ID,"x-leeway-speaker-profile-id":SPEAKER_ID,
              "x-leeway-reference-sha256":REFERENCE_SHA,"x-audio-format":"pcm_s16le",
              "x-audio-sample-rate":str(MODEL.sr),"x-audio-channels":"1",
              "x-leeway-streaming-mode":"BOUNDED_SEGMENT","x-leeway-compute-profile":PROFILE
            }
            for k,v in headers.items():self.send_header(k,v)
            self.end_headers(); t0=time.perf_counter()
            try:
                for seg in segments(text):
                    if state["cancelRequested"]:state["cancelled"]=True;state["status"]="CANCELLED";break
                    with LOCK: wav=MODEL.generate(seg,audio_prompt_path=None)
                    data=pcm16(wav)
                    if state["firstAudioLatencyMs"] is None:
                        state["firstAudioLatencyMs"]=round((time.perf_counter()-t0)*1000,3)
                    state["status"]="STREAMING"
                    for off in range(0,len(data),8192):
                        if state["cancelRequested"]:state["cancelled"]=True;state["status"]="CANCELLED";break
                        chunk=data[off:off+8192]; self.wfile.write(chunk); self.wfile.flush()
                        state["chunkCount"]+=1;state["audioBytes"]+=len(chunk)
                    if state["cancelRequested"]:break
                if not state["cancelled"]:state["status"]="COMPLETED"
            except (BrokenPipeError,ConnectionResetError):
                state["cancelRequested"]=True;state["cancelled"]=True;state["status"]="CANCELLED_CLIENT_DISCONNECT"
            except Exception as exc:
                state["status"]="FAILED";state["error"]=type(exc).__name__+": "+str(exc)
            finally:
                state["totalLatencyMs"]=round((time.perf_counter()-t0)*1000,3)
                state["completedAtEpochMs"]=int(time.time()*1000)
            return
        if p.startswith("/streams/") and p.endswith("/cancel"):
            sid=p.split("/")[2]; state=STREAMS.get(sid)
            if not state:return self.send_json(404,{"error":"STREAM_NOT_FOUND"})
            state["cancelRequested"]=True
            return self.send_json(200,{"streamId":sid,"cancelRequested":True,"status":state["status"]})
        return self.send_json(404,{"error":"NOT_FOUND"})

if __name__=="__main__":
    print(json.dumps({
      "provider":"chatterbox-nano-http","listen":f"http://{HOST}:{PORT}",
      "referenceSHA256":REFERENCE_SHA,"modelLoadSeconds":round(MODEL_LOAD_SECONDS,3),
      "conditioningSeconds":round(CONDITIONING_SECONDS,3),"computeProfile":PROFILE,
      "threads":THREADS,"computeControllerHash":CONTROLLER_HASH
    }),flush=True)
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
