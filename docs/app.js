/*
LEEWAY HEADER — DO NOT REMOVE
REGION: AI.ORCHESTRATION.VOICE
TAG: AI.ORCHESTRATION.LEEWAYLIVE.APP
WHAT = LeeWay Live Pages orchestration for device-local HTTP voice/vision
WHY = Keep Pages lightweight while model/media execution stays on-device
WHO = LeeWay Industries / Agent Lee
WHERE = docs/app.js
WHEN = 2026-09-23
HOW = Browser media + DeviceRuntimeClient + generation epochs + evidence
*/
import{BrowserMediaAdapter}from"./media.js";
import{DeviceRuntimeClient}from"./device-runtime.js";
const $=id=>document.getElementById(id),trace=[];let epoch=0,cameraOn=false,listening=false,runtimeReady=false;
function evidence(event,data={}){const row={event,t:Math.round(performance.now()),epoch,...data};trace.push(row);$("evidenceTrace").textContent=trace.slice(-80).map(x=>JSON.stringify(x)).join("\n")}
const media=new BrowserMediaAdapter(evidence),device=new DeviceRuntimeClient(evidence);
function setState(s){$("agentSphere").dataset.state=s;$("stateLabel").textContent=s.toUpperCase();$("agentSphere").setAttribute("aria-label","Agent Lee state: "+s)}
function showUser(text){$("userBubble").hidden=!text;$("userTranscript").textContent=text}
function agent(text,speak=false){$("agentText").textContent=text;if(!speak)return;if(!runtimeReady){evidence("VOICE_BLOCKED",{reason:"DEVICE_RUNTIME_NOT_READY"});return}const my=epoch;device.speak(text,{onStart:()=>my===epoch&&setState("speaking"),onEnd:()=>my===epoch&&setState("idle")}).catch(e=>{if(my===epoch)setState("idle");evidence("VOICE_ERROR",{message:e.message})})}
function interrupt(reason){epoch++;media.stopRecognition();device.stopVoice();listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("CONTROL_CANCEL",{reason,newEpoch:epoch})}
async function refreshRuntime(){const result=await device.probe();runtimeReady=result.ok;$("runtimeStatus").textContent=result.ok?"DEVICE RUNTIME: ONLINE":"DEVICE RUNTIME: INSTALL / PERMISSION NEEDED";if(result.ok){agent("Device-local LeeWay runtime detected. Voice and vision can execute on this device.",false)}else{agent("GitHub Pages is ready. Install or start the device-local LeeWay HTTP runtime to enable local voice and vision.",false)}return result}
async function handleInput(text){text=text.trim();if(!text)return;interrupt("new_turn");showUser(text);setState("thinking");evidence("USER_INPUT",{text});const my=epoch;const response=runtimeReady?"The device runtime is connected. The model conversation adapter is the next gate; voice and vision execute locally now.":"The Pages interface is connected, but heavy inference is not hosted by GitHub Pages. Start the device runtime first.";await Promise.resolve();if(my!==epoch)return;agent(response,runtimeReady);evidence("MODEL_BOUNDARY",{state:runtimeReady?"DEVICE_MODEL_ADAPTER_PENDING":"DEVICE_RUNTIME_UNAVAILABLE"})}
$("cameraToggle").onclick=async()=>{try{if(cameraOn){media.stopCamera();cameraOn=false;$("cameraPanel").classList.remove("active");$("cameraStatus").textContent="OFF"}else{await media.startCamera($("cameraView"));cameraOn=true;$("cameraPanel").classList.add("active");$("cameraStatus").textContent="LIVE"}}catch(e){evidence("ERROR",{stage:"camera",message:e.message});agent("Camera permission or browser support is unavailable.")}};
$("visionTestButton").onclick=async()=>{if(!runtimeReady){await refreshRuntime();if(!runtimeReady)return agent("Device runtime unavailable; vision test did not execute.")}if(!cameraOn)return agent("Turn the camera on first.");try{setState("thinking");const r=await device.analyzeVideoFrame($("cameraView"),"Describe the non-sensitive visible scene concisely. Do not identify unknown people or infer protected traits.");agent(r.responseText||"Vision returned no text.",false);setState("idle")}catch(e){setState("idle");evidence("VISION_ERROR",{message:e.message});agent("Device vision execution failed: "+e.message)}};
$("voiceTestButton").onclick=async()=>{if(!runtimeReady){await refreshRuntime();if(!runtimeReady)return agent("Device runtime unavailable; clone voice test did not execute.")}agent("Agent Lee device-local clone voice is running through the LeeWay HTTP runtime.",true)};
$("micButton").onclick=()=>{if(listening){interrupt("mic_stop");return}interrupt("mic_start");listening=true;$("micButton").setAttribute("aria-pressed","true");setState("listening");try{media.startSpeechRecognition({onInterim:t=>showUser(t),onFinal:t=>{listening=false;$("micButton").setAttribute("aria-pressed","false");handleInput(t)},onError:e=>{listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("ERROR",{stage:"speech_recognition",message:e.message});agent("Browser transcription is unavailable. Type below; native device STT is a separate runtime adapter.")}})}catch(e){listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("ERROR",{stage:"speech_recognition",message:e.message});agent("This browser does not expose speech recognition. Type below while the device STT adapter is qualified.")}};
$("sendButton").onclick=()=>{const t=$("textInput").value;$("textInput").value="";handleInput(t)};$("textInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("sendButton").click()});
evidence("APP_READY",{capabilities:media.capabilities()});refreshRuntime();