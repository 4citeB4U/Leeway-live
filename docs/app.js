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
const $=id=>document.getElementById(id),trace=[];
let epoch=0,cameraOn=false,listening=false;
function evidence(event,data={}){
  const row={event,t:Math.round(performance.now()),epoch,...data};
  trace.push(row);
  $("evidenceTrace").textContent=trace.slice(-60).map(x=>JSON.stringify(x)).join("\n");
}
const media=new BrowserMediaAdapter(evidence);
const model=new BrowserModelRuntime(evidence);
const ecosystem=new EcosystemBinding(evidence);
function setState(state){
  $("agentSphere").dataset.state=state;
  $("stateLabel").textContent=state.toUpperCase();
  $("agentSphere").setAttribute("aria-label","Agent Lee state: "+state);
}
function showUser(text){
  $("userBubble").hidden=!text;
  $("userTranscript").textContent=text;
}
function agent(text,speak=false){
  $("agentText").textContent=text;
  if(!speak)return;
  const my=epoch;
  try{
    media.speak(text,{
      onStart:()=>my===epoch&&setState("speaking"),
      onEnd:()=>my===epoch&&setState("idle")
    });
  }catch(error){
    evidence("ERROR",{stage:"speech_output",message:error.message});
    setState("idle");
  }
}
function interrupt(reason){
  epoch++;
  media.stopRecognition();
  media.stopSpeaking();
  listening=false;
  $("micButton").setAttribute("aria-pressed","false");
  setState("idle");
  evidence("CONTROL_CANCEL",{reason,newEpoch:epoch});
}
async function handleInput(text){
  text=text.trim();
  if(!text)return;
  interrupt("new_turn");
  showUser(text);
  setState("thinking");
  evidence("USER_INPUT",{text});
  const my=epoch;
  try{
    const response=await model.generate(text,ecosystem.systemContext());
    if(my!==epoch)return;
    agent(response,true);
    evidence("MODEL_INFERENCE_OK",{kind:"text",runtime:model.status()});
  }catch(error){
    if(my!==epoch)return;
    setState("idle");
    agent("The local model could not load on this browser. Check Evidence for the exact failure.");
    evidence("MODEL_INFERENCE_FAILED",{kind:"text",message:error.message});
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
    if(cameraOn){
      media.stopCamera();
      cameraOn=false;
      $("cameraPanel").classList.remove("active");
      $("cameraStatus").textContent="OFF";
    }else{
      await media.startCamera($("cameraView"));
      cameraOn=true;
      $("cameraPanel").classList.add("active");
      $("cameraStatus").textContent="LIVE";
    }
  }catch(error){
    evidence("ERROR",{stage:"camera",message:error.message});
    agent("Camera permission or browser support is unavailable.");
  }
};
$("seeButton").onclick=async()=>{
  interrupt("vision_turn");
  setState("thinking");
  try{
    const result=await model.see(cameraFrame());
    agent(result,true);
    evidence("MODEL_INFERENCE_OK",{kind:"vision",runtime:model.status()});
  }catch(error){
    setState("idle");
    agent("Vision could not run on this device. Check Evidence for the exact failure.");
    evidence("MODEL_INFERENCE_FAILED",{kind:"vision",message:error.message});
  }
};
$("micButton").onclick=()=>{
  if(listening){
    interrupt("mic_stop");
    return;
  }
  interrupt("mic_start");
  listening=true;
  $("micButton").setAttribute("aria-pressed","true");
  setState("listening");
  try{
    media.startSpeechRecognition({
      onInterim:text=>showUser(text),
      onFinal:text=>{
        listening=false;
        $("micButton").setAttribute("aria-pressed","false");
        handleInput(text);
      },
      onError:error=>{
        listening=false;
        $("micButton").setAttribute("aria-pressed","false");
        setState("idle");
        evidence("ERROR",{stage:"speech_recognition",message:error.message});
        agent("Microphone transcription is unavailable here. Type below.");
      }
    });
  }catch(error){
    listening=false;
    $("micButton").setAttribute("aria-pressed","false");
    setState("idle");
    evidence("ERROR",{stage:"speech_recognition",message:error.message});
    agent("This browser does not expose speech recognition. Type below.");
  }
};
$("sendButton").onclick=()=>{
  const text=$("textInput").value;
  $("textInput").value="";
  handleInput(text);
};
$("textInput").addEventListener("keydown",event=>{
  if(event.key==="Enter")$("sendButton").click();
});
(async()=>{
  evidence("APP_READY",{capabilities:media.capabilities(),model:model.status()});
  const state=await ecosystem.hydrate();
  $("runtimeStatus").textContent=
    "MODEL "+model.status().device.toUpperCase()+
    " • SKILLS "+(state.capabilityManifold&&state.coreGovernance?"BOUND":"OFF")+
    " • FORMULA "+state.formulaRuntime;
  evidence("ECOSYSTEM_READY",ecosystem.summary());
})().catch(error=>evidence("BOOT_ERROR",{message:error.message}));
