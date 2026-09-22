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
WHAT = Browser media adapter for camera, microphone transcription, and speech output
WHY = Provides a real Pages-compatible G0 media path while native Android adapters remain separate
WHO = LeeWay Industries / Agent Lee
WHERE = docs/media.js
WHEN = 2026-09-22
HOW = Uses permission-gated browser media APIs and explicit capability detection
AGENTS:
ASSESS
AUDIT
PRIVACY
AGENT_LEE
LICENSE:
MIT
*/
export class BrowserMediaAdapter{
 constructor(onEvidence=()=>{}){this.onEvidence=onEvidence;this.cameraStream=null;this.recognition=null}
 capabilities(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;return{camera:!!navigator.mediaDevices?.getUserMedia,speechRecognition:!!SR,speechSynthesis:"speechSynthesis"in window}}
 async startCamera(video){if(!navigator.mediaDevices?.getUserMedia)throw new Error("Camera API unavailable");this.cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:false});video.srcObject=this.cameraStream;await video.play();this.onEvidence("CAMERA_STARTED")}
 stopCamera(){this.cameraStream?.getTracks().forEach(t=>t.stop());this.cameraStream=null;this.onEvidence("CAMERA_STOPPED")}
 startSpeechRecognition({onInterim,onFinal,onError}){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)throw new Error("Browser speech recognition unavailable");this.stopRecognition();const r=new SR();this.recognition=r;r.continuous=false;r.interimResults=true;r.lang=navigator.language||"en-US";r.onresult=e=>{let interim="",final="";for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;e.results[i].isFinal?final+=t:interim+=t}if(interim)onInterim?.(interim);if(final)onFinal?.(final)};r.onerror=e=>onError?.(new Error(e.error));r.onend=()=>{if(this.recognition===r)this.recognition=null};r.start();this.onEvidence("MIC_RECOGNITION_STARTED")}
 stopRecognition(){try{this.recognition?.abort()}catch{}this.recognition=null}
 speak(text,{onStart,onEnd}={}){if(!("speechSynthesis"in window))throw new Error("Speech synthesis unavailable");speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);const voices=speechSynthesis.getVoices();const preferred=voices.find(v=>/Natural|Neural|Google US English|Samantha/i.test(v.name))||voices.find(v=>/^en/i.test(v.lang));if(preferred)u.voice=preferred;u.rate=.98;u.pitch=1;u.onstart=()=>{this.onEvidence("SPEECH_STARTED");onStart?.()};u.onend=()=>{this.onEvidence("SPEECH_ENDED");onEnd?.()};speechSynthesis.speak(u)}
 stopSpeaking(){if("speechSynthesis"in window)speechSynthesis.cancel();this.onEvidence("SPEECH_CANCELLED")}
}