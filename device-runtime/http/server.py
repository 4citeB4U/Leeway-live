#!/usr/bin/env python3
"""
LeeWay Live device-local HTTP runtime gateway.
Provider-agnostic loopback control plane for voice/vision/model adapters.
"""
from __future__ import annotations
import base64, hashlib, json, os, platform, time, urllib.request, urllib.error
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

HOST=os.environ.get("LEEWAY_HTTP_HOST","127.0.0.1")
PORT=int(os.environ.get("LEEWAY_HTTP_PORT","8788"))
VOICE=os.environ.get("LEEWAY_VOICE_PROVIDER_URL","").rstrip("/")
VISION=os.environ.get("LEEWAY_VISION_PROVIDER_URL","").rstrip("/")
PAGES_ORIGIN=os.environ.get("LEEWAY_PAGES_ORIGIN","https://4citeb4u.github.io")
RUNTIME_ID="LEEWAY_LIVE_DEVICE_HTTP_RUNTIME_V1"

def fetch_json(url, method="GET", payload=None, timeout=120):
    data=None if payload is None else json.dumps(payload).encode()
    req=urllib.request.Request(url,data=data,method=method,headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req,timeout=timeout) as r:
        raw=r.read()
        return r.status, dict(r.headers), json.loads(raw.decode() or "{}")

def fetch_bytes(url, payload, timeout=180):
    data=json.dumps(payload).encode()
    req=urllib.request.Request(url,data=data,method="POST",headers={"Content-Type":"application/json"})
    r=urllib.request.urlopen(req,timeout=timeout)
    return r.status, dict(r.headers), r

def passport():
    return {
      "schema":"leeway.device-passport.v1",
      "runtimeId":RUNTIME_ID,
      "platform":platform.system(),
      "release":platform.release(),
      "machine":platform.machine(),
      "python":platform.python_version(),
      "voiceProviderConfigured":bool(VOICE),
      "visionProviderConfigured":bool(VISION),
      "generatedAtEpochMs":int(time.time()*1000)
    }

class H(BaseHTTPRequestHandler):
    server_version="LeeWayLiveHTTP/1.0"
    def cors(self):
        origin=self.headers.get("Origin","")
        allow=PAGES_ORIGIN if origin.startswith(PAGES_ORIGIN) else ("http://127.0.0.1" if origin.startswith("http://127.0.0.1") else "")
        if allow:self.send_header("Access-Control-Allow-Origin",allow)
        self.send_header("Vary","Origin")
        self.send_header("Access-Control-Allow-Headers","content-type,authorization")
        self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS")
        self.send_header("Cache-Control","no-store")
    def send_json(self,code,obj):
        raw=json.dumps(obj,separators=(",",":")).encode()
        self.send_response(code);self.send_header("Content-Type","application/json");self.send_header("Content-Length",str(len(raw)));self.cors();self.end_headers();self.wfile.write(raw)
    def body(self):
        n=int(self.headers.get("Content-Length","0") or 0)
        return json.loads(self.rfile.read(n).decode() or "{}")
    def do_OPTIONS(self):
        self.send_response(204);self.cors();self.end_headers()
    def do_GET(self):
        p=self.path.split("?",1)[0]
        if p=="/health": return self.send_json(200,{"ok":True,"runtimeId":RUNTIME_ID,"host":HOST,"port":PORT})
        if p=="/v1/device/passport": return self.send_json(200,passport())
        if p=="/v1/runtime/status":
            return self.send_json(200,{"ok":True,"runtimeId":RUNTIME_ID,"voiceProvider":VOICE or None,"visionProvider":VISION or None})
        if p=="/v1/voice/profiles":
            if not VOICE:return self.send_json(503,{"ok":False,"error":"VOICE_PROVIDER_NOT_CONFIGURED"})
            try: code,_,obj=fetch_json(VOICE+"/voice-profiles");return self.send_json(code,obj)
            except Exception as e:return self.send_json(502,{"ok":False,"error":str(e)})
        if p=="/v1/vision/status":
            if not VISION:return self.send_json(503,{"ok":False,"error":"VISION_PROVIDER_NOT_CONFIGURED"})
            try: code,_,obj=fetch_json(VISION+"/vision/status");return self.send_json(code,obj)
            except Exception as e:return self.send_json(502,{"ok":False,"error":str(e)})
        if p.startswith("/v1/voice/streams/"):
            sid=p.split("/")[4]
            try: code,_,obj=fetch_json(VOICE+"/streams/"+sid);return self.send_json(code,obj)
            except Exception as e:return self.send_json(502,{"ok":False,"error":str(e)})
        return self.send_json(404,{"ok":False,"error":"NOT_FOUND"})
    def do_POST(self):
        p=self.path.split("?",1)[0]
        if p=="/v1/vision/analyze":
            if not VISION:return self.send_json(503,{"ok":False,"error":"VISION_PROVIDER_NOT_CONFIGURED"})
            try: code,_,obj=fetch_json(VISION+"/vision/analyze/image","POST",self.body());return self.send_json(code,obj)
            except Exception as e:return self.send_json(502,{"ok":False,"error":str(e)})
        if p=="/v1/voice/stream":
            if not VOICE:return self.send_json(503,{"ok":False,"error":"VOICE_PROVIDER_NOT_CONFIGURED"})
            try:
                code,h,r=fetch_bytes(VOICE+"/tts/stream",self.body())
                self.send_response(code)
                for k in ("content-type","x-leeway-stream-id","x-leeway-voice-id","x-leeway-agent-id","x-leeway-speaker-profile-id","x-leeway-reference-sha256","x-audio-format","x-audio-sample-rate","x-audio-channels"):
                    if h.get(k): self.send_header(k,h[k])
                self.cors();self.end_headers()
                while True:
                    chunk=r.read(8192)
                    if not chunk: break
                    self.wfile.write(chunk);self.wfile.flush()
                r.close();return
            except BrokenPipeError:return
            except Exception as e:return self.send_json(502,{"ok":False,"error":str(e)})
        if p.startswith("/v1/voice/streams/") and p.endswith("/cancel"):
            sid=p.split("/")[4]
            try: code,_,obj=fetch_json(VOICE+"/streams/"+sid+"/cancel","POST",{});return self.send_json(code,obj)
            except Exception as e:return self.send_json(502,{"ok":False,"error":str(e)})
        return self.send_json(404,{"ok":False,"error":"NOT_FOUND"})

if __name__=="__main__":
    print(json.dumps({"runtimeId":RUNTIME_ID,"listen":f"http://{HOST}:{PORT}","voice":VOICE or None,"vision":VISION or None}))
    ThreadingHTTPServer((HOST,PORT),H).serve_forever()
\n