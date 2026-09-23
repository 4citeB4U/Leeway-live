#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
python - <<'PY'
import importlib.util, json, os, platform, shutil, subprocess, time

def mod(name):
    return importlib.util.find_spec(name) is not None

def cmd(name):
    return shutil.which(name) is not None

def mem_total_mib():
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemTotal:"):
                    return round(int(line.split()[1])/1024,2)
    except Exception: pass
    return 0

ram=mem_total_mib()
torch_ok=mod("torch")
tts_ok=mod("TTS")
termux_torch_search=False
try:
    out=subprocess.check_output(["pkg","search","python-torch"],stderr=subprocess.STDOUT,text=True,timeout=20)
    termux_torch_search="python-torch" in out
except Exception:
    pass

xtts_reasons=[]
if ram < 6000: xtts_reasons.append("RAM_BELOW_6GB_PREQUALIFICATION_FLOOR")
if not torch_ok: xtts_reasons.append("PYTORCH_NOT_INSTALLED")
if not tts_ok: xtts_reasons.append("COQUI_TTS_NOT_INSTALLED")

result={
 "schema":"leeway.device-provider-qualification.v1",
 "generatedAtEpochMs":int(time.time()*1000),
 "machine":platform.machine(),
 "ramMiB":ram,
 "voice":{
   "xttsV2":{
     "termuxPythonTorchPackageVisible":termux_torch_search,
     "torchImportable":torch_ok,
     "coquiTtsImportable":tts_ok,
     "state":"READY_FOR_EXECUTION_TEST" if not xtts_reasons else "BLOCKED_PENDING_DEPENDENCY_OR_DEVICE_GATE",
     "blockers":xtts_reasons,
     "promotionRequires":[
       "model_load",
       "speaker_clone_identity",
       "native_streaming",
       "first_audio_latency",
       "memory_peak",
       "thermal_long_session",
       "multilingual_output",
       "barge_in_cancel"
     ]
   }
 },
 "vision":{
   "nativeAndroidLiteRt":{"state":"REQUIRES_APK_ADAPTER_PROBE"},
   "llamaCppHttp":{"llamaServerPresent":cmd("llama-server"),"state":"READY_FOR_MODEL_TEST" if cmd("llama-server") else "NOT_INSTALLED"},
   "promotionRequires":["real_image_analysis","camera_frame","memory_peak","latency","thermal_long_session"]
 },
 "formula":{
   "executionState":"NOT_EXECUTED",
   "meaning":"This is provider evidence for the Formula Funnel, not a canonical Formula result."
 }
}
print(json.dumps(result,indent=2))
PY
