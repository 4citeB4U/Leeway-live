/*
LEEWAY HEADER — DO NOT REMOVE
REGION: MEDIA.DEVICE.HTTP
TAG: MEDIA.DEVICE.LEEWAYLIVE.LOCAL_HTTP_CLIENT
WHAT = GitHub Pages client for the device-local LeeWay HTTP runtime
WHY = Keep Pages lightweight while voice/vision/model execution remains on-device
WHO = LeeWay Industries / Agent Lee
WHERE = docs/device-runtime.js
WHEN = 2026-09-23
HOW = Loopback discovery, Local Network Access-compatible fetch, PCM Web Audio sink, vision frame upload
*/
const DEFAULT_BASE="http://127.0.0.1:8788";
function loopbackRequest(url,init={}){
 const opts={...init,mode:"cors",cache:"no-store"};
 try{return new Request(url,{...opts,targetAddressSpace:"loopback"})}catch{return new Request(url,opts)}
}
async function loopbackFetch(url,init={}){return fetch(loopbackRequest(url,init))}
export class DeviceRuntimeClient{
 constructor(onEvidence=()=>{},base=DEFAULT_BASE){this.onEvidence=onEvidence;this.base=base.replace(/\/$/,"");this.audioContext=null;this.abort=null;this.sources=[];this.nextStart=0}
 async permissionState(){for(const name of ["loopback-network","local-network-access"]){try{const p=await navigator.permissions?.query({name});if(p)return{name,state:p.state}}catch{}}return{name:null,state:"unknown"}}
 async probe(){const permission=await this.permissionState();try{const r=await loopbackFetch(this.base+"/health");if(!r.ok)throw new Error("HTTP "+r.status);const health=await r.json();const passport=await (await loopbackFetch(this.base+"/v1/device/passport")).json();this.onEvidence("DEVICE_RUNTIME_READY",{permission,health,passport});return{ok:true,permission,health,passport}}catch(e){this.onEvidence("DEVICE_RUNTIME_UNAVAILABLE",{permission,message:e.message});return{ok:false,permission,error:e.message}}}
 async voiceProfiles(){const r=await loopbackFetch(this.base+"/v1/voice/profiles");if(!r.ok)throw new Error("Voice profiles HTTP "+r.status);return r.json()}
 async visionStatus(){const r=await loopbackFetch(this.base+"/v1/vision/status");if(!r.ok)throw new Error("Vision status HTTP "+r.status);return r.json()}
 async analyzeImageBase64(imageBase64,prompt="Describe the visible scene."){const r=await loopbackFetch(this.base+"/v1/vision/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({imageBase64,prompt})});if(!r.ok)throw new Error("Vision analyze HTTP "+r.status);const data=await r.json();this.onEvidence("DEVICE_VISION_RESULT",{model:data.model,receiptPath:data.receiptPath});return data}
 async analyzeVideoFrame(video,prompt){const c=document.createElement("canvas");c.width=video.videoWidth||640;c.height=video.videoHeight||480;const g=c.getContext("2d");g.drawImage(video,0,0,c.width,c.height);const data=c.toDataURL("image/jpeg",.85).split(",")[1];return this.analyzeImageBase64(data,prompt)}
 async context(){if(!this.audioContext)this.audioContext=new (window.AudioContext||window.webkitAudioContext)({sampleRate:24000});if(this.audioContext.state==="suspended")await this.audioContext.resume();return this.audioContext}
 stopVoice(){try{this.abort?.abort()}catch{}this.abort=null;for(const s of this.sources.splice(0)){try{s.stop()}catch{}}this.nextStart=0;this.onEvidence("DEVICE_VOICE_LOCAL_FLUSH")}
 async speak(text,{language="en",voice="LEEWAY_VOICE::AGENT_LEE::DEFAULT_CLONE",onStart,onEnd}={}){
  this.stopVoice();this.abort=new AbortController();
  const r=await loopbackFetch(this.base+"/v1/voice/stream",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text,voice,language,speed:1}),signal:this.abort.signal});
  if(!r.ok||!r.body)throw new Error("Voice stream HTTP "+r.status);
  const ctx=await this.context(),reader=r.body.getReader();let pending=new Uint8Array(0),first=true,total=0,seq=0;
  const streamId=r.headers.get("x-leeway-stream-id")||"",voiceId=r.headers.get("x-leeway-voice-id")||voice;
  this.onEvidence("DEVICE_VOICE_STREAM_OPEN",{streamId,voiceId,referenceSHA256:r.headers.get("x-leeway-reference-sha256")});
  while(true){const {done,value}=await reader.read();if(done)break;if(!value?.length)continue;let bytes=value;if(pending.length){const x=new Uint8Array(pending.length+bytes.length);x.set(pending);x.set(bytes,pending.length);bytes=x;pending=new Uint8Array(0)}if(bytes.length%2){pending=bytes.slice(-1);bytes=bytes.slice(0,-1)}if(!bytes.length)continue;const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),samples=new Float32Array(bytes.byteLength/2);for(let i=0;i<samples.length;i++)samples[i]=dv.getInt16(i*2,true)/32768;const b=ctx.createBuffer(1,samples.length,24000);b.copyToChannel(samples,0);const s=ctx.createBufferSource();s.buffer=b;s.connect(ctx.destination);const at=Math.max(ctx.currentTime+.025,this.nextStart||0);s.start(at);this.nextStart=at+b.duration;this.sources.push(s);total+=bytes.length;if(first){first=false;onStart?.();this.onEvidence("DEVICE_VOICE_FIRST_AUDIO",{streamId,voiceId,bytes:bytes.length})}this.onEvidence("DEVICE_VOICE_CHUNK",{streamId,sequenceNumber:seq++,bytes:bytes.length})}
  const delay=Math.max(0,(this.nextStart-ctx.currentTime)*1000);setTimeout(()=>{onEnd?.();this.onEvidence("DEVICE_VOICE_STREAM_END",{streamId,voiceId,totalBytes:total})},delay)
 }
}
