/*
LEEWAY HEADER — DO NOT REMOVE
REGION: AI.MODEL.RUNTIME
TAG: AI.MODEL.LEEWAYLIVE.BROWSER
5WH:
WHAT = LeeWay Live model router for local LeeWay Ollama plus browser-local fallback
WHY = Uses the strongest reachable runtime without making GitHub Pages depend on a host server
WHO = LeeWay Industries / Agent Lee
WHERE = docs/model-runtime.js
WHEN = 2026-09-23
HOW = Ollama-first discovery with Transformers.js WebGPU/WASM fallback
AGENTS: ASSESS AUDIT AGENT_LEE VERITAS
LICENSE: MIT
*/
const TRANSFORMERS_URL="https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0";
const TEXT_PRIMARY="onnx-community/SmolLM2-135M-Instruct-ONNX-MHA",TEXT_FALLBACK="onnx-community/Qwen2.5-0.5B-Instruct";
const VISION_MODEL="Xenova/vit-gpt2-image-captioning",OLLAMA_MODEL="leeway/agent-lee-core:latest",OLLAMA_VISION="leeway/agent-lee-vision-fast:latest";
let pipelineFn=null;async function pipeline(){if(!pipelineFn){const m=await import(TRANSFORMERS_URL);pipelineFn=m.pipeline}return pipelineFn(...arguments)}
export class BrowserModelRuntime{
 constructor(evidence=()=>{}){this.evidence=evidence;this.text=null;this.vision=null;this.device=navigator.gpu?"webgpu":"cpu";this.ollamaBase=localStorage.getItem("LEEWAY_OLLAMA_BASE_URL")||"http://127.0.0.1:11434";this.ollamaState="UNEXPOSED";}
 async probeOllama(){try{const c=new AbortController();setTimeout(()=>c.abort(),1200);const r=await fetch(this.ollamaBase+"/api/tags",{signal:c.signal,cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);const j=await r.json();this.ollamaState=(j.models||[]).some(x=>x.name===OLLAMA_MODEL)?"AVAILABLE":"MODEL_MISSING";this.evidence("OLLAMA_DISCOVERY",{state:this.ollamaState,base:this.ollamaBase});return this.ollamaState==="AVAILABLE"}catch(e){this.ollamaState="UNEXPOSED";this.evidence("OLLAMA_DISCOVERY",{state:"UNEXPOSED",message:e.message});return false}}
 async ollamaChat(userText,systemText=""){const body={model:OLLAMA_MODEL,messages:[{role:"system",content:systemText||"You are Agent Lee running in LeeWay Live. Be concise and truthful."},{role:"user",content:userText}],stream:false,think:false,options:{temperature:0,num_predict:192}};const r=await fetch(this.ollamaBase+"/api/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});if(!r.ok)throw new Error("Ollama HTTP "+r.status);const j=await r.json();this.evidence("MODEL_INFERENCE_PROVIDER",{provider:"OLLAMA",model:j.model||OLLAMA_MODEL});return String(j.message?.content||"").trim()}
 async loadText(){if(this.text)return this.text;this.evidence("MODEL_LOAD_START",{kind:"text",device:this.device,model:TEXT_PRIMARY});try{this.text=await pipeline("text-generation",TEXT_PRIMARY,{device:this.device,dtype:this.device==="webgpu"?"q4":"q8"});this.evidence("MODEL_LOAD_OK",{kind:"text",model:TEXT_PRIMARY,device:this.device});return this.text}catch(error){this.evidence("MODEL_LOAD_FALLBACK",{kind:"text",message:error.message,model:TEXT_FALLBACK});this.text=await pipeline("text-generation",TEXT_FALLBACK,{device:this.device,dtype:this.device==="webgpu"?"q4":"q8"});this.evidence("MODEL_LOAD_OK",{kind:"text",model:TEXT_FALLBACK,device:this.device});return this.text}}
 async generate(userText,systemText=""){if(this.ollamaState==="AVAILABLE"||await this.probeOllama())return this.ollamaChat(userText,systemText);const g=await this.loadText();const messages=[{role:"system",content:systemText||"You are Agent Lee running in LeeWay Live. Be concise, truthful, and never claim tool or Formula execution without evidence."},{role:"user",content:userText}];const out=await g(messages,{max_new_tokens:32,do_sample:false});const value=out?.[0]?.generated_text,text=Array.isArray(value)?value.at(-1)?.content:value;this.evidence("MODEL_INFERENCE_PROVIDER",{provider:"TRANSFORMERS_JS",model:TEXT_PRIMARY});return String(text||"No model text returned.").trim()}
 async ollamaSee(imageUrl,prompt){const base64=imageUrl.split(",").pop();const body={model:OLLAMA_VISION,messages:[{role:"user",content:prompt,images:[base64]}],stream:false,think:false,options:{temperature:0,num_predict:128}};const r=await fetch(this.ollamaBase+"/api/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});if(!r.ok)throw new Error("Ollama vision HTTP "+r.status);const j=await r.json();this.evidence("MODEL_INFERENCE_PROVIDER",{provider:"OLLAMA_VISION",model:j.model||OLLAMA_VISION});return String(j.message?.content||"").trim()}
 async loadVision(){if(this.vision)return this.vision;this.evidence("MODEL_LOAD_START",{kind:"vision",device:this.device,model:VISION_MODEL});this.vision=await pipeline("image-to-text",VISION_MODEL,{device:this.device,dtype:"q8"});this.evidence("MODEL_LOAD_OK",{kind:"vision",model:VISION_MODEL,device:this.device});return this.vision}
 async see(imageUrl,prompt="Describe what you can see in this camera frame."){if(this.ollamaState==="AVAILABLE"||await this.probeOllama())try{return await this.ollamaSee(imageUrl,prompt)}catch(e){this.evidence("VISION_PROVIDER_FALLBACK",{message:e.message})}const v=await this.loadVision();const out=await v(imageUrl,{max_new_tokens:64});const caption=String(out?.[0]?.generated_text||out?.generated_text||"No vision text returned.").trim();this.evidence("VISION_CAPTION",{caption,prompt});return caption}
 status(){return{device:this.device,ollama:this.ollamaState,textLoaded:!!this.text,visionLoaded:!!this.vision,textPrimary:TEXT_PRIMARY,visionModel:VISION_MODEL}}
}