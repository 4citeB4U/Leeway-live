import json, threading, time, urllib.request
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import numpy as np
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS

torch.set_num_threads(8)
t0=time.perf_counter()
MODEL=ChatterboxTurboTTS.from_pretrained(device="cpu",nano=True)
LOAD=time.perf_counter()-t0

def pcm16(wav):
    x=wav.detach().cpu().float().numpy().reshape(-1)
    return (np.clip(x,-1,1)*32767.0).astype("<i2").tobytes()

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path!="/tts/stream":
            self.send_response(404);self.end_headers();return
        n=int(self.headers.get("content-length","0"))
        text=json.loads(self.rfile.read(n).decode())["text"]
        t=time.perf_counter();wav=MODEL.generate(text);gen=time.perf_counter()-t
        data=pcm16(wav)
        self.send_response(200)
        self.send_header("content-type","application/octet-stream")
        self.send_header("x-audio-format","pcm_s16le")
        self.send_header("x-audio-sample-rate",str(MODEL.sr))
        self.send_header("x-leeway-streaming-mode","BOUNDED_SEGMENT")
        self.send_header("x-generation-seconds",str(gen))
        self.end_headers()
        for i in range(0,len(data),8192):
            self.wfile.write(data[i:i+8192]);self.wfile.flush()

srv=ThreadingHTTPServer(("127.0.0.1",8792),H)
threading.Thread(target=srv.serve_forever,daemon=True).start()
payload=json.dumps({"text":"LeeWay Chatterbox Nano HTTP smoke proof."}).encode()
req=urllib.request.Request("http://127.0.0.1:8792/tts/stream",data=payload,headers={"content-type":"application/json"},method="POST")
start=time.perf_counter()
with urllib.request.urlopen(req,timeout=600) as r:
    headers_ms=(time.perf_counter()-start)*1000
    first=r.read(8192)
    first_ms=(time.perf_counter()-start)*1000
    total=len(first)
    while True:
        b=r.read(8192)
        if not b:break
        total+=len(b)
    result={
      "status":r.status,
      "modelLoadSeconds":round(LOAD,3),
      "headersLatencyMs":round(headers_ms,3),
      "firstBodyLatencyMs":round(first_ms,3),
      "generationSeconds":round(float(r.headers["x-generation-seconds"]),3),
      "audioBytes":total,
      "sampleRate":MODEL.sr,
      "streamingMode":r.headers["x-leeway-streaming-mode"],
      "threads":torch.get_num_threads(),
      "identityBoundary":"BUILTIN_CHATTERBOX_VOICE_CI_ONLY_NOT_AGENT_LEE"
    }
print("LEEWAY_CI_RESULT="+json.dumps(result,sort_keys=True))
assert result["status"]==200
assert result["audioBytes"]>0
assert result["firstBodyLatencyMs"]>0
srv.shutdown()
