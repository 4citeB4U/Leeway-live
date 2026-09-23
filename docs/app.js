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
WHY = Connects GitHub Pages to native Android boundaries or the real local Agent Lee desktop bridge without fabricating execution
WHO = LeeWay Industries / Agent Lee
WHERE = docs/app.js
WHEN = 2026-09-22
HOW = BrowserMediaAdapter + local Agent Lee bridge + generation epochs + evidence
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
function evidence(event,data={}){const row={event,t:Math.round(performance.now()),epoch,...data};trace.push(row);$("evidenceTrace").textContent=trace.slice(-60).map(x=>JSON.stringify(x)).join("\n")}
const media=new BrowserMediaAdapter(evidence);
function setState(s){$("agentSphere").dataset.state=s;$("stateLabel").textContent=s.toUpperCase();$("agentSphere").setAttribute("aria-label","Agent Lee state: "+s)}
function showUser(text){$("userBubble").hidden=!text;$("userTranscript").textContent=text}
function agent(text,speak=false){$("agentText").textContent=text;if(speak){const my=epoch;media.speak(text,{onStart:()=>my===epoch&&setState("speaking"),onEnd:()=>my===epoch&&setState("idle"),onError:e=>{if(my===epoch)setState("idle");evidence("VOICE_ERROR",{message:e.message})}}).catch(()=>{})}}
function interrupt(reason){epoch++;media.stopRecognition();media.stopSpeaking();listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("CONTROL_CANCEL",{reason,newEpoch:epoch})}
async function handleInput(text){text=text.trim();if(!text)return;interrupt("new_turn");showUser(text);setState("thinking");evidence("USER_INPUT",{text});const my=epoch;
 try{const result=await media.turn(text);if(my!==epoch)return;const response=result?.assistant?.text||"Agent Lee returned no text.";agent(response,true);evidence("MODEL_EXECUTION",{state:"LOCAL_AGENT_LEE_EXECUTED",turnId:result?.turn?.id||null,voiceId:result?.assistant?.voiceId||null})}
 catch(e){if(my!==epoch)return;setState("idle");const response="The local LeeWay runtime is not reachable from this browser. GitHub Pages remains the install/status surface; connect the local desktop bridge or use the Android runtime.";agent(response,false);evidence("MODEL_BOUNDARY",{state:"LOCAL_BRIDGE_UNAVAILABLE",message:e.message})}}
$("cameraToggle").onclick=async()=>{try{if(cameraOn){media.stopCamera();cameraOn=false;$("cameraPanel").classList.remove("active");$("cameraStatus").textContent="OFF"}else{await media.startCamera($("cameraView"));cameraOn=true;$("cameraPanel").classList.add("active");$("cameraStatus").textContent="LIVE"}}catch(e){evidence("ERROR",{stage:"camera",message:e.message});agent("Camera permission or browser support is unavailable.")}};
$("micButton").onclick=()=>{if(listening){interrupt("mic_stop");return}interrupt("mic_start");listening=true;$("micButton").setAttribute("aria-pressed","true");setState("listening");try{media.startSpeechRecognition({onInterim:t=>showUser(t),onFinal:t=>{listening=false;$("micButton").setAttribute("aria-pressed","false");handleInput(t)},onError:e=>{listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("ERROR",{stage:"speech_recognition",message:e.message});agent("Browser transcription is unavailable here. Type below or use the native Android/local Ears path.")}})}catch(e){listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("ERROR",{stage:"speech_recognition",message:e.message});agent("This browser does not expose speech recognition. Type below while the governed runtime handles output.")}};
$("sendButton").onclick=()=>{const t=$("textInput").value;$("textInput").value="";handleInput(t)};$("textInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("sendButton").click()});
window.addEventListener("pagehide",()=>{media.endConversation()});
fetch("./live-voice-fabric-v1.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(c=>c&&evidence("LIVE_VOICE_FABRIC_CONTRACT",{contractId:c.contractId,desktop:c.adapters?.desktop?.status,android:c.adapters?.android?.status})).catch(()=>{});
evidence("APP_READY",{capabilities:media.capabilities()});