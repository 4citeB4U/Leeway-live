/*
LEEWAY HEADER — DO NOT REMOVE
REGION: AI.ORCHESTRATION.VOICE
TAG: AI.ORCHESTRATION.LEEWAYLIVE.APP
5WH:
WHAT = LeeWay Live browser orchestration for real local model, voice, vision, and ecosystem bindings
WHY = Provides one governed GitHub Pages interaction path without fabricated execution claims
WHO = LeeWay Industries / Agent Lee
WHERE = docs/app.js
WHEN = 2026-09-23
HOW = Browser media + local Transformers.js inference + read-only Skills/Formula discovery
AGENTS: ASSESS AUDIT AGENT_LEE VERITAS
LICENSE: MIT
*/
import{BrowserMediaAdapter}from"./media.js";
import{BrowserModelRuntime}from"./model-runtime.js";
import{EcosystemBinding}from"./ecosystem.js";
const $=id=>document.getElementById(id),trace=[];let epoch=0,cameraOn=false,listening=false;
function evidence(event,data={}){const row={event,t:Math.round(performance.now()),epoch,...data};trace.push(row);$("evidenceTrace").textContent=trace.slice(-60).map(x=>JSON.stringify(x)).join("\n")}
const media=new BrowserMediaAdapter(evidence),model=new BrowserModelRuntime(evidence),ecosystem=new EcosystemBinding(evidence);
function setState(s){$("agentSphere").dataset.state=s;$("stateLabel").textContent=s.toUpperCase();$("agentSphere").setAttribute("aria-label","Agent Lee state: "+s)}
function showUser(text){$("userBubble").hidden=!text;$("userTranscript").textContent=text}
function agent(text,speak=false){$("agentText").textContent=text;if(speak){const my=epoch;try{media.speak(text,{onStart:()=>my===epoch&&setState("speaking"),onEnd:()=>my===epoch&&setState("idle")})}catch(e){evidence("ERROR",{stage:"speech_output",message:e.message});setState("idle")}}}
function interrupt(reason){epoch++;media.stopRecognition();media.stopSpeaking();listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("CONTROL_CANCEL",{reason,newEpoch:epoch})}
async function handleInput(text){text=text.trim();if(!text)return;interrupt("new_turn");showUser(text);setState("thinking");evidence("USER_INPUT",{text});const my=epoch;try{const skillContext=await ecosystem.taskContext(text);const response=await model.generate(text,ecosystem.systemContext()+"\n"+skillContext);if(my!==epoch)return;agent(response,true);evidence("MODEL_INFERENCE_OK",{kind:"text",runtime:model.status()})}catch(e){if(my!==epoch)return;setState("idle");agent("The local model could not load on this browser. Check Evidence for the exact failure.");evidence("MODEL_INFERENCE_FAILED",{kind:"text",message:e.message})}}
function cameraFrame(){const v=$("cameraView");if(!cameraOn||!v.videoWidth)throw new Error("Camera is not live");const c=document.createElement("canvas");c.width=Math.min(v.videoWidth,1024);c.height=Math.round(v.videoHeight*c.width/v.videoWidth);c.getContext("2d").drawImage(v,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.82)}
$("connectLocal").onclick=async()=>{evidence("LOCAL_CONNECT_REQUEST",{});$("runtimeStatus").textContent="CONNECTING LOCAL RUNTIME…";const state=await ecosystem.probeFormula({interactive:true});$("runtimeStatus").textContent="MODEL "+model.status().device.toUpperCase()+" • SKILLS "+(ecosystem.state.manifest?.skillCount||0)+" BOUND • FORMULA "+state;agent(state==="VERIFIED"?"Local LeeWay Runtime Fabric verified.":"Local Runtime Fabric was not granted or is not reachable. Check Evidence and browser local-network permission.",false)};
$("cameraToggle").onclick=async()=>{try{if(cameraOn){media.stopCamera();cameraOn=false;$("cameraPanel").classList.remove("active");$("cameraStatus").textContent="OFF"}else{await media.startCamera($("cameraView"));cameraOn=true;$("cameraPanel").classList.add("active");$("cameraStatus").textContent="LIVE"}}catch(e){evidence("ERROR",{stage:"camera",message:e.message});agent("Camera permission or browser support is unavailable.")}};
$("seeButton").onclick=async()=>{interrupt("vision_turn");setState("thinking");try{const result=await model.see(cameraFrame());agent(result,true);evidence("MODEL_INFERENCE_OK",{kind:"vision",runtime:model.status()})}catch(e){setState("idle");agent("Vision could not run on this device. Check Evidence for the exact failure.");evidence("MODEL_INFERENCE_FAILED",{kind:"vision",message:e.message})}};
$("micButton").onclick=()=>{if(listening){interrupt("mic_stop");return}interrupt("mic_start");listening=true;$("micButton").setAttribute("aria-pressed","true");setState("listening");try{media.startSpeechRecognition({onInterim:t=>showUser(t),onFinal:t=>{listening=false;$("micButton").setAttribute("aria-pressed","false");handleInput(t)},onError:e=>{listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("ERROR",{stage:"speech_recognition",message:e.message});agent("Microphone transcription is unavailable here. Type below.")}})}catch(e){listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("ERROR",{stage:"speech_recognition",message:e.message});agent("This browser does not expose speech recognition. Type below.")}};
$("sendButton").onclick=()=>{const t=$("textInput").value;$("textInput").value="";handleInput(t)};$("textInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("sendButton").click()});
(async()=>{evidence("APP_READY",{capabilities:media.capabilities(),model:model.status()});const s=await ecosystem.hydrate();$("runtimeStatus").textContent="MODEL "+model.status().device.toUpperCase()+" • SKILLS "+(s.manifest?.skillCount||0)+" BOUND • FORMULA "+s.formulaServiceIdentity;evidence("ECOSYSTEM_READY",ecosystem.summary())})().catch(e=>evidence("BOOT_ERROR",{message:e.message}));
