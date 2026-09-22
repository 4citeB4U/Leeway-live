/*
LEEWAY HEADER — DO NOT REMOVE
REGION: AI.ORCHESTRATION.VOICE
TAG: AI.ORCHESTRATION.LEEWAYLIVE.APP
COLOR_ONION_HEX:
NEON=#64E9FF
FLUO=#36B7FF
PASTEL=#CDEFFF
ICON_ASCII:
family=lucide
glyph=workflow
5WH:
WHAT = LeeWay Live browser orchestration and interaction state machine
WHY = Coordinates camera, microphone, text, speech, interruption, and evidence without faking native model execution
WHO = LeeWay Industries / Agent Lee
WHERE = docs/app.js
WHEN = 2026-09-22
HOW = ES module using BrowserMediaAdapter, generation epochs, and explicit runtime boundaries
AGENTS:
ASSESS
AUDIT
AGENT_LEE
VERITAS
LICENSE:
MIT
*/
import{BrowserMediaAdapter}from"./media.js";
const $=id=>document.getElementById(id),trace=[];let epoch=0,cameraOn=false,listening=false;
function evidence(event,data={}){const row={event,t:Math.round(performance.now()),epoch,...data};trace.push(row);$("evidenceTrace").textContent=trace.slice(-40).map(x=>JSON.stringify(x)).join("\n")}
const media=new BrowserMediaAdapter(evidence);
function setState(s){$("agentSphere").dataset.state=s;$("stateLabel").textContent=s.toUpperCase();$("agentSphere").setAttribute("aria-label","Agent Lee state: "+s)}
function showUser(text){$("userBubble").hidden=!text;$("userTranscript").textContent=text}
function agent(text,speak=false){$("agentText").textContent=text;if(speak){const my=epoch;media.speak(text,{onStart:()=>my===epoch&&setState("speaking"),onEnd:()=>my===epoch&&setState("idle")})}}
function interrupt(reason){epoch++;media.stopRecognition();media.stopSpeaking();listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("CONTROL_CANCEL",{reason,newEpoch:epoch})}
async function handleInput(text){text=text.trim();if(!text)return;interrupt("new_turn");showUser(text);setState("thinking");evidence("USER_INPUT",{text});const my=epoch;
/* G0 deliberately does not fabricate Gemma inference. Native Android model adapter replaces this boundary at G3. */
const response="I heard you. The LeeWay Live interface is connected, but the on-device Gemma runtime is not installed in this browser build yet.";
await Promise.resolve();if(my!==epoch)return;agent(response,true);evidence("MODEL_BOUNDARY",{state:"NATIVE_ANDROID_MODEL_PENDING"})}
$("cameraToggle").onclick=async()=>{try{if(cameraOn){media.stopCamera();cameraOn=false;$("cameraPanel").classList.remove("active");$("cameraStatus").textContent="OFF"}else{await media.startCamera($("cameraView"));cameraOn=true;$("cameraPanel").classList.add("active");$("cameraStatus").textContent="LIVE"}}catch(e){evidence("ERROR",{stage:"camera",message:e.message});agent("Camera permission or browser support is unavailable.")}};
$("micButton").onclick=()=>{if(listening){interrupt("mic_stop");return}interrupt("mic_start");listening=true;$("micButton").setAttribute("aria-pressed","true");setState("listening");try{media.startSpeechRecognition({onInterim:t=>showUser(t),onFinal:t=>{listening=false;$("micButton").setAttribute("aria-pressed","false");handleInput(t)},onError:e=>{listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("ERROR",{stage:"speech_recognition",message:e.message});agent("Microphone transcription is not available here. You can type below.")}})}catch(e){listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("ERROR",{stage:"speech_recognition",message:e.message});agent("This browser does not expose speech recognition. Type below while the Android voice runtime is being built.")}};
$("sendButton").onclick=()=>{const t=$("textInput").value;$("textInput").value="";handleInput(t)};$("textInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("sendButton").click()});
evidence("APP_READY",{capabilities:media.capabilities()});