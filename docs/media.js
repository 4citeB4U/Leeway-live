/*
LEEWAY HEADER — DO NOT REMOVE
REGION: MEDIA.DEVICE.ADAPTER
TAG: MEDIA.DEVICE.LEEWAYLIVE.BROWSER
COLOR_ONION_HEX:
NEON=#64E9FF
FLUO=#36B7FF
PASTEL=#CDEFFF
ICON_ASCII:
family=lucide
glyph=video
5WH:
WHAT = Browser media + local LeeWay bridge adapter
WHY = Makes GitHub Pages a governed client of the real Agent Lee runtime and clone voice when local bridge is present
WHO = LeeWay Industries / Agent Lee
WHERE = docs/media.js
WHEN = 2026-09-22
HOW = Browser media APIs + localhost Agent Lee conversation/PCM streaming bridge
AGENTS:
ASSESS
AUDIT
PRIVACY
AGENT_LEE
VERITAS
LICENSE:
MIT
*/
export class BrowserMediaAdapter{
 constructor(onEvidence=()=>{}){
  this.onEvidence=onEvidence;this.cameraStream=null;this.recognition=null;
  this.bridgeBase="http://127.0.0.1:8080";this.sessionId=null;
  this.audioContext=null;this.abortController=null;this.sources=[];this.nextStartTime=0;
 }
 capabilities(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;return{camera:!!navigator.mediaDevices?.getUserMedia,speechRecognition:!!SR,localLeeWayBridge:true,agentLeeCloneStreaming:true,browserSpeechDiagnostic:"speechSynthesis"in window}}
 async startCamera(video){if(!navigator.mediaDevices?.getUserMedia)throw new Error("Camera API unavailable");this.cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:false});video.srcObject=this.cameraStream;await video.play();this.onEvidence("CAMERA_STARTED")}
 stopCamera(){this.cameraStream?.getTracks().forEach(t=>t.stop());this.cameraStream=null;this.onEvidence("CAMERA_STOPPED")}
 startSpeechRecognition({onInterim,onFinal,onError}){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)throw new Error("Browser speech recognition unavailable");this.stopRecognition();const r=new SR();this.recognition=r;r.continuous=false;r.interimResults=true;r.lang=navigator.language||"en-US";r.onresult=e=>{let interim="",final="";for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;e.results[i].isFinal?final+=t:interim+=t}if(interim)onInterim?.(interim);if(final)onFinal?.(final)};r.onerror=e=>onError?.(new Error(e.error));r.onend=()=>{if(this.recognition===r)this.recognition=null};r.start();this.onEvidence("MIC_RECOGNITION_STARTED")}
 stopRecognition(){try{this.recognition?.abort()}catch{}this.recognition=null}
 async ensureSession(){
  if(this.sessionId)return this.sessionId;
  const r=await fetch(this.bridgeBase+"/agent-lee/conversation/start",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({operatorName:"Leonard",preferredLanguage:"en",defaultLanguage:"en",subject:"leeway-live-pages"}),cache:"no-store"});
  if(!r.ok)throw new Error("Agent Lee session start failed: HTTP "+r.status);
  const data=await r.json();this.sessionId=data?.session?.sessionId||data?.data?.session?.sessionId||null;
  if(!this.sessionId)throw new Error("Agent Lee session ID missing");
  this.onEvidence("LEEWAY_SESSION_STARTED",{sessionId:this.sessionId});return this.sessionId;
 }
 async turn(text){
  const sessionId=await this.ensureSession();
  const r=await fetch(this.bridgeBase+"/agent-lee/conversation/turn",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId,text,speak:false,targetLanguage:"en"}),cache:"no-store"});
  if(!r.ok)throw new Error("Agent Lee turn failed: HTTP "+r.status);
  const data=await r.json();this.onEvidence("LEEWAY_AGENT_TURN",{sessionId,turnId:data?.turn?.id||null,voiceId:data?.assistant?.voiceId||null});
  return data;
 }
 async endConversation(){if(!this.sessionId)return;const sessionId=this.sessionId;this.sessionId=null;try{await fetch(this.bridgeBase+"/agent-lee/conversation/end",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId}),keepalive:true})}catch{}this.onEvidence("LEEWAY_SESSION_ENDED",{sessionId})}
 async _context(){if(!this.audioContext)this.audioContext=new (window.AudioContext||window.webkitAudioContext)({sampleRate:24000});if(this.audioContext.state==="suspended")await this.audioContext.resume();return this.audioContext}
 _stopSources(){for(const s of this.sources.splice(0)){try{s.stop()}catch{}}this.nextStartTime=0}
 async speak(text,{onStart,onEnd,onError}={}){
  this.stopSpeaking();this.abortController=new AbortController();
  try{
   const r=await fetch(this.bridgeBase+"/agent-lee/voice/speak-stream",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text,voice:"LEEWAY_VOICE::AGENT_LEE::DEFAULT_CLONE",language:"en",speed:1}),signal:this.abortController.signal,cache:"no-store"});
   if(!r.ok||!r.body)throw new Error("Agent Lee clone stream failed: HTTP "+r.status);
   const ctx=await this._context(),reader=r.body.getReader();let pending=new Uint8Array(0),started=false,totalBytes=0,seq=0;
   const voiceId=r.headers.get("x-agent-lee-voice-id")||"LEEWAY_VOICE::AGENT_LEE::DEFAULT_CLONE",streamId=r.headers.get("x-agent-lee-stream-id")||"";
   this.onEvidence("LEEWAY_CLONE_STREAM_OPEN",{voiceId,streamId,format:r.headers.get("x-audio-format"),sampleRate:r.headers.get("x-audio-sample-rate")});
   while(true){
    const {done,value}=await reader.read();if(done)break;if(!value?.length)continue;
    let bytes=value;if(pending.length){const merged=new Uint8Array(pending.length+bytes.length);merged.set(pending);merged.set(bytes,pending.length);bytes=merged;pending=new Uint8Array(0)}
    if(bytes.length%2){pending=bytes.slice(bytes.length-1);bytes=bytes.slice(0,-1)}if(!bytes.length)continue;
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),samples=new Float32Array(bytes.byteLength/2);
    for(let i=0;i<samples.length;i++)samples[i]=view.getInt16(i*2,true)/32768;
    const buffer=ctx.createBuffer(1,samples.length,24000);buffer.copyToChannel(samples,0);const source=ctx.createBufferSource();source.buffer=buffer;source.connect(ctx.destination);
    const startAt=Math.max(ctx.currentTime+.03,this.nextStartTime||0);source.start(startAt);this.nextStartTime=startAt+buffer.duration;this.sources.push(source);totalBytes+=bytes.length;
    if(!started){started=true;onStart?.();this.onEvidence("LEEWAY_VOICE_FIRST_AUDIO",{streamId,voiceId,bytes:bytes.length})}
    this.onEvidence("LEEWAY_AUDIO_CHUNK",{streamId,sequenceNumber:seq++,bytes:bytes.length});
   }
   const remaining=Math.max(0,(this.nextStartTime-ctx.currentTime)*1000);setTimeout(()=>{onEnd?.();this.onEvidence("LEEWAY_CLONE_STREAM_ENDED",{streamId,voiceId,totalBytes})},remaining);
  }catch(e){if(e?.name==="AbortError"){this.onEvidence("LEEWAY_CLONE_STREAM_CANCELLED");return}this.onEvidence("LEEWAY_CLONE_STREAM_FAILED",{message:e.message});onError?.(e);throw e}
 }
 stopSpeaking(){try{this.abortController?.abort()}catch{}this.abortController=null;this._stopSources();this.onEvidence("LEEWAY_VOICE_CANCELLED")}
 speakDiagnostic(text,{onStart,onEnd}={}){if(!("speechSynthesis"in window))throw new Error("Speech synthesis unavailable");speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.onstart=()=>onStart?.();u.onend=()=>onEnd?.();speechSynthesis.speak(u);this.onEvidence("BROWSER_TTS_DIAGNOSTIC_ONLY")}
}