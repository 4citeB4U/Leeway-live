/*
LEEWAY HEADER — DO NOT REMOVE
REGION: AI.MODEL.RUNTIME
TAG: AI.MODEL.LEEWAYLIVE.BROWSER
5WH:
WHAT = Browser-local text and vision inference adapter
WHY = Replaces the canned model boundary with real local inference on GitHub Pages
WHO = LeeWay Industries / Agent Lee
WHERE = docs/model-runtime.js
WHEN = 2026-09-23
HOW = Lazy Transformers.js loading with WebGPU first and WASM fallback
AGENTS: ASSESS AUDIT AGENT_LEE VERITAS
LICENSE: MIT
*/
const TRANSFORMERS_URL="https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0";
const TEXT_PRIMARY="onnx-community/Qwen2.5-0.5B-Instruct";
const TEXT_FALLBACK="onnx-community/SmolLM2-135M-Instruct-ONNX-MHA";
const VISION_MODEL="HuggingFaceTB/SmolVLM-256M-Instruct";
let pipelineFn=null;
async function pipeline(){
  if(!pipelineFn){
    const m=await import(TRANSFORMERS_URL);
    pipelineFn=m.pipeline;
  }
  return pipelineFn(...arguments);
}
export class BrowserModelRuntime{
  constructor(evidence=()=>{}){
    this.evidence=evidence;
    this.text=null;
    this.vision=null;
    this.device=navigator.gpu?"webgpu":"wasm";
  }
  async loadText(){
    if(this.text)return this.text;
    this.evidence("MODEL_LOAD_START",{kind:"text",device:this.device,model:TEXT_PRIMARY});
    try{
      this.text=await pipeline("text-generation",TEXT_PRIMARY,{device:this.device,dtype:this.device==="webgpu"?"q4":"q8"});
      this.evidence("MODEL_LOAD_OK",{kind:"text",model:TEXT_PRIMARY,device:this.device});
      return this.text;
    }catch(error){
      this.evidence("MODEL_LOAD_FALLBACK",{kind:"text",message:error.message,model:TEXT_FALLBACK});
      this.text=await pipeline("text-generation",TEXT_FALLBACK,{device:this.device,dtype:this.device==="webgpu"?"q4f16":"q8"});
      this.evidence("MODEL_LOAD_OK",{kind:"text",model:TEXT_FALLBACK,device:this.device});
      return this.text;
    }
  }
  async generate(userText,systemText=""){
    const g=await this.loadText();
    const messages=[
      {role:"system",content:systemText||"You are Agent Lee running in LeeWay Live. Be concise, truthful, and never claim tool or Formula execution without evidence."},
      {role:"user",content:userText}
    ];
    const out=await g(messages,{max_new_tokens:160,do_sample:false});
    const value=out?.[0]?.generated_text;
    const text=Array.isArray(value)?value.at(-1)?.content:value;
    return String(text||"No model text returned.").trim();
  }
  async loadVision(){
    if(this.vision)return this.vision;
    this.evidence("MODEL_LOAD_START",{kind:"vision",device:this.device,model:VISION_MODEL});
    this.vision=await pipeline("image-text-to-text",VISION_MODEL,{device:this.device,dtype:this.device==="webgpu"?"q4":"q8"});
    this.evidence("MODEL_LOAD_OK",{kind:"vision",model:VISION_MODEL,device:this.device});
    return this.vision;
  }
  async see(imageUrl,prompt="Describe what you can see in this camera frame."){
    const v=await this.loadVision();
    const messages=[{role:"user",content:[{type:"image",url:imageUrl},{type:"text",text:prompt}]}];
    const out=await v(messages,{max_new_tokens:120,do_sample:false});
    const value=out?.[0]?.generated_text;
    const text=Array.isArray(value)?value.at(-1)?.content:value;
    return String(text||"No vision text returned.").trim();
  }
  status(){
    return{
      device:this.device,
      textLoaded:!!this.text,
      visionLoaded:!!this.vision,
      textPrimary:TEXT_PRIMARY,
      visionModel:VISION_MODEL
    };
  }
}