#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
python - <<'PY'
import json, os, platform, shutil, subprocess, time

def run(*args):
    try:
        return subprocess.check_output(args, stderr=subprocess.DEVNULL, text=True, timeout=8).strip()
    except Exception:
        return ""

def mem_kib():
    try:
        rows={}
        with open("/proc/meminfo","r",encoding="utf-8") as f:
            for line in f:
                k,v=line.split(":",1); rows[k]=int(v.strip().split()[0])
        return rows
    except Exception:
        return {}

m=mem_kib()
stat=shutil.disk_usage(os.path.expanduser("~"))
props={
    "sdk":run("getprop","ro.build.version.sdk"),
    "release":run("getprop","ro.build.version.release"),
    "model":run("getprop","ro.product.model"),
    "manufacturer":run("getprop","ro.product.manufacturer"),
    "abi":run("getprop","ro.product.cpu.abi"),
    "hardware":run("getprop","ro.hardware")
}
battery=run("dumpsys","battery")
thermal=run("dumpsys","thermalservice")
def lines_with(text, needles):
    return [x.strip() for x in text.splitlines() if any(n.lower() in x.lower() for n in needles)][:40]

passport={
  "schema":"leeway.device-passport.v1",
  "generatedAtEpochMs":int(time.time()*1000),
  "platform":{
    "system":platform.system(),
    "machine":platform.machine(),
    "python":platform.python_version(),
    **props
  },
  "memory":{
    "totalMiB":round(m.get("MemTotal",0)/1024,2),
    "availableMiB":round(m.get("MemAvailable",0)/1024,2)
  },
  "storage":{
    "homeTotalMiB":round(stat.total/1048576,2),
    "homeFreeMiB":round(stat.free/1048576,2)
  },
  "executables":{
    "python":bool(shutil.which("python")),
    "curl":bool(shutil.which("curl")),
    "ffmpeg":bool(shutil.which("ffmpeg")),
    "termuxInfo":bool(shutil.which("termux-info")),
    "vulkanInfo":bool(shutil.which("vulkaninfo")),
    "llamaServer":bool(shutil.which("llama-server"))
  },
  "batteryEvidence":lines_with(battery,["level:","temperature:","health:","status:","AC powered","USB powered"]),
  "thermalEvidence":lines_with(thermal,["Temperature","status","throttl"]),
  "authority":"Creator/Human Authority > LeeWay Standards",
  "formulaState":"INPUT_EVIDENCE_ONLY_NOT_FORMULA_OUTPUT"
}
print(json.dumps(passport,indent=2))
PY
