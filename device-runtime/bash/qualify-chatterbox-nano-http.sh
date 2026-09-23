#!/usr/bin/env bash
set -euo pipefail
BASE="${LEEWAY_CHATTERBOX_BASE:-http://127.0.0.1:8792}"
PYTHON_BIN="${PYTHON_BIN:-python}"

echo "== HEALTH =="
curl -fsS "$BASE/health"; echo

echo "== VOICE PROFILE =="
PROFILE="$(curl -fsS "$BASE/voice-profiles")"
printf '%s\n' "$PROFILE"
printf '%s' "$PROFILE" | grep -q 'LEEWAY_VOICE::AGENT_LEE::DEFAULT_CLONE'

echo "== FIRST AUDIO / BYTE PROOF =="
"$PYTHON_BIN" - "$BASE" <<'PY'
import http.client,json,sys,time,urllib.parse
base=urllib.parse.urlparse(sys.argv[1])
c=http.client.HTTPConnection(base.hostname,base.port,timeout=300)
body=json.dumps({
 "text":"LeeWay Chatterbox Nano HTTP qualification proof.",
 "voice":"LEEWAY_VOICE::AGENT_LEE::DEFAULT_CLONE",
 "language":"en"
}).encode()
t=time.perf_counter()
c.request("POST","/tts/stream",body,{"content-type":"application/json"})
r=c.getresponse()
headers_ms=(time.perf_counter()-t)*1000
first=r.read(8192)
first_ms=(time.perf_counter()-t)*1000
total=len(first)
while True:
    b=r.read(8192)
    if not b: break
    total+=len(b)
result={
 "httpStatus":r.status,
 "headersLatencyMs":round(headers_ms,3),
 "firstBodyLatencyMs":round(first_ms,3),
 "audioBytes":total,
 "streamId":r.getheader("x-leeway-stream-id"),
 "voiceId":r.getheader("x-leeway-voice-id"),
 "referenceSHA256":r.getheader("x-leeway-reference-sha256"),
 "audioFormat":r.getheader("x-audio-format"),
 "sampleRate":r.getheader("x-audio-sample-rate"),
 "streamingMode":r.getheader("x-leeway-streaming-mode"),
 "computeProfile":r.getheader("x-leeway-compute-profile")
}
print(json.dumps(result,indent=2))
assert r.status==200
assert total>0
assert result["voiceId"]=="LEEWAY_VOICE::AGENT_LEE::DEFAULT_CLONE"
c.close()
PY

echo "CHATTERBOX_NANO_HTTP_MACHINE_GATE=PASS"
