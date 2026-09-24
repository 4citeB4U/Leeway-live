/*
LEEWAY HEADER — DO NOT REMOVE
REGION: AI.ORCHESTRATION.VOICE
TAG: AI.ORCHESTRATION.LEEWAYLIVE.APP
5WH:
WHAT = LeeWay Live GitHub Pages bootstrap, installer, browser diagnostics, and evidence state machine
WHY = Makes GitHub Pages the single front door while the installed phone package remains the true sensory execution harness
WHO = LeeWay Industries / Agent Lee
WHERE = docs/app.js
WHEN = 2026-09-23
HOW = Canonical GitHub manifest discovery + browser diagnostics + explicit evidence states
AGENTS: ASSESS AUDIT AGENT_LEE VERITAS
LICENSE: MIT
*/
import{BrowserMediaAdapter}from"./media.js";
import{BrowserModelRuntime}from"./model-runtime.js";
import{EcosystemBinding}from"./ecosystem.js";
const $=id=>document.getElementById(id),trace=[];
let epoch=0,cameraOn=false,listening=false;
function evidence(event,data={}){
  const row={event,t:Math.round(performance.now()),epoch,...data};
  trace.push(row);
  $("evidenceTrace").textContent=trace.slice(-80).map(x=>JSON.stringify(x)).join("\n");
}
const media=new BrowserMediaAdapter(evidence);
const model=new BrowserModelRuntime(evidence);
const ecosystem=new EcosystemBinding(evidence);
function setState(state){
  $("agentSphere").dataset.state=state;
  $("stateLabel").textContent=state.toUpperCase();
  $("agentSphere").setAttribute("aria-label","Agent Lee state: "+state);
}
function showUser(text){$("userBubble").hidden=!text;$("userTranscript").textContent=text}
function agent(text,speak=false){
  $("agentText").textContent=text;
  if(!speak)return;
  const my=epoch;
  try{media.speak(text,{onStart:()=>my===epoch&&setState("speaking"),onEnd:()=>my===epoch&&setState("idle")})}
  catch(error){evidence("ERROR",{stage:"speech_output",message:error.message});setState("idle")}
}
function interrupt(reason){
  epoch++;media.stopRecognition();media.stopSpeaking();listening=false;
  $("micButton").setAttribute("aria-pressed","false");setState("idle");
  evidence("CONTROL_CANCEL",{reason,newEpoch:epoch});
}
function configureInstaller(state){
  const pkg=state.androidPackage;
  const button=$("installButton");
  if(!pkg){
    button.textContent="ANDROID PACKAGE UNAVAILABLE";
    button.setAttribute("aria-disabled","true");
    button.removeAttribute("href");
    $("packageInfo").textContent="Canonical Device Bridge package manifest could not provide an Android package.";
    evidence("ANDROID_PACKAGE_BLOCKED");
    return;
  }
  button.textContent="DOWNLOAD LEEWAY PHONE HARNESS v"+pkg.versionName;
  button.href=pkg.absoluteDownloadUrl;
  button.target="_blank";
  button.rel="noopener";
  button.removeAttribute("aria-disabled");
  const mb=(pkg.sizeBytes/1048576).toFixed(1);
  $("packageInfo").textContent="Android • "+mb+" MiB • SHA-256 "+pkg.sha256+" • phone-local runtime";
  button.addEventListener("click",()=>evidence("ANDROID_PACKAGE_DOWNLOAD_REQUESTED",{versionName:pkg.versionName,versionCode:pkg.versionCode,sha256:pkg.sha256,url:pkg.absoluteDownloadUrl}),{once:false});
}
async function handleInput(text){
  text=text.trim();if(!text)return;
  interrupt("new_turn");showUser(text);setState("thinking");evidence("USER_INPUT",{text});
  const my=epoch;
  try{
    const response=await model.generate(text,ecosystem.systemContext());
    if(my!==epoch)return;
    agent(response,true);
    evidence("MODEL_INFERENCE_OK",{kind:"browser_text_diagnostic",runtime:model.status()});
  }catch(error){
    if(my!==epoch)return;
    setState("idle");
    agent("Browser diagnostic model did not complete. The phone package is the primary LeeWay Live runtime.");
    evidence("MODEL_INFERENCE_FAILED",{kind:"browser_text_diagnostic",message:error.message});
  }
}
function cameraFrame(){
  const video=$("cameraView");
  if(!cameraOn||!video.videoWidth)throw new Error("Camera is not live");
  const canvas=document.createElement("canvas");
  canvas.width=Math.min(video.videoWidth,1024);
  canvas.height=Math.round(video.videoHeight*canvas.width/video.videoWidth);
  canvas.getContext("2d").drawImage(video,0,0,canvas.width,canvas.height);
  return canvas.toDataURL("image/jpeg",.82);
}
$("cameraToggle").onclick=async()=>{
  try{
    if(cameraOn){media.stopCamera();cameraOn=false;$("cameraPanel").classList.remove("active");$("cameraStatus").textContent="OFF"}
    else{await media.startCamera($("cameraView"));cameraOn=true;$("cameraPanel").classList.add("active");$("cameraStatus").textContent="LIVE"}
  }catch(error){evidence("ERROR",{stage:"camera",message:error.message});agent("Browser camera diagnostic is unavailable.")}
};
$("seeButton").onclick=async()=>{
  interrupt("vision_turn");setState("thinking");
  try{
    const result=await model.see(cameraFrame());
    agent(result,true);
    evidence("MODEL_INFERENCE_OK",{kind:"browser_vision_diagnostic",runtime:model.status()});
  }catch(error){
    setState("idle");
    agent("Browser vision diagnostic did not complete. Install the phone harness for native sensory execution.");
    evidence("MODEL_INFERENCE_FAILED",{kind:"browser_vision_diagnostic",message:error.message});
  }
};
$("micButton").onclick=()=>{
  if(listening){interrupt("mic_stop");return}
  interrupt("mic_start");listening=true;$("micButton").setAttribute("aria-pressed","true");setState("listening");
  try{
    media.startSpeechRecognition({
      onInterim:text=>showUser(text),
      onFinal:text=>{listening=false;$("micButton").setAttribute("aria-pressed","false");handleInput(text)},
      onError:error=>{listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");evidence("ERROR",{stage:"speech_recognition",message:error.message});agent("Browser microphone diagnostic is unavailable.")}
    });
  }catch(error){
    listening=false;$("micButton").setAttribute("aria-pressed","false");setState("idle");
    evidence("ERROR",{stage:"speech_recognition",message:error.message});agent("This browser does not expose speech recognition.")
  }
};
$("sendButton").onclick=()=>{const text=$("textInput").value;$("textInput").value="";handleInput(text)};
$("textInput").addEventListener("keydown",event=>{if(event.key==="Enter")$("sendButton").click()});
(async()=>{
  evidence("APP_READY",{capabilities:media.capabilities(),browserDiagnosticModel:model.status()});
  const state=await ecosystem.hydrate();
  configureInstaller(state);
  const phone=state.androidPackage?"PHONE PACKAGE "+state.androidPackage.versionName:"PHONE PACKAGE BLOCKED";
  const skills=state.capabilityManifold&&state.coreGovernance?"SKILLS BOUND":"SKILLS OFF";
  const formula=state.formulaAuthority?"FORMULA AUTHORITY BOUND":"FORMULA OFF";
  $("runtimeStatus").textContent=phone+" • "+skills+" • "+formula;
  agent(state.androidPackage?
    "LeeWay Live is ready. Download the phone sensory harness; GitHub Pages is the front door and the phone is the execution runtime.":
    "LeeWay Live loaded, but the Android package manifest did not resolve."
  );
  evidence("ECOSYSTEM_READY",ecosystem.summary());
})().catch(error=>evidence("BOOT_ERROR",{message:error.message}));
