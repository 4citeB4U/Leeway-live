/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.RUNTIME.BINDING
TAG: CORE.RUNTIME.LEEWAYLIVE.ECOSYSTEM
5WH:
WHAT = LeeWay Live bindings to 238-skill promotion authority and centralized Formula service
WHY = Makes ecosystem relationships executable without copying Formula logic or flooding model context
WHO = LeeWay Industries / Agent Lee
WHERE = docs/ecosystem.js
WHEN = 2026-09-23
HOW = Local committed skill manifest, task-scoped raw skill retrieval, and Formula health identity verification
AGENTS: ASSESS AUDIT AGENT_LEE VERITAS
LICENSE: MIT
*/
const RAW="https://raw.githubusercontent.com/4citeB4U/";
const urls={manifest:"./skills-manifest.json",formulaAuthority:RAW+"Leeway-formula-live/main/authority/formula-authority.json",formulaConsumer:RAW+"Leeway-formula-live/main/contracts/consumer-contract.json",formulaBindings:RAW+"Leeway-formula-live/main/contracts/ecosystem-bindings.json"};
async function getJson(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error(url+" -> "+r.status);return r.json()}
async function getText(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error(url+" -> "+r.status);return r.text()}
export class EcosystemBinding{
 constructor(evidence=()=>{}){this.evidence=evidence;this.state={manifest:null,formulaAuthority:null,formulaConsumer:null,formulaBindings:null,formulaServiceIdentity:"UNEXPOSED",formulaExecution:"NOT_EXECUTED"}}
 async hydrate(){for(const [k,u] of Object.entries(urls)){try{this.state[k]=await getJson(u);this.evidence("BINDING_OK",{binding:k})}catch(e){this.evidence("BINDING_ERROR",{binding:k,message:e.message})}}await this.probeFormula();return this.state}
 async probeFormula(){const base=localStorage.getItem("LEEWAY_FORMULA_BASE_URL")||"http://127.0.0.1:4001",path=this.state.formulaConsumer?.endpoints?.health?.path||"/runtime/formula/v1/health";try{const c=new AbortController();setTimeout(()=>c.abort(),1500);const r=await fetch(base+path,{signal:c.signal,cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);const h=await r.json(),pin=this.state.formulaAuthority?.pinnedSha256?.engine;this.state.formulaHealth=h;this.state.formulaServiceIdentity=(pin&&h.implementationSha256===pin&&h.loaded===true&&h.goldenVectorPass===true)?"VERIFIED":"MISMATCH";this.evidence("FORMULA_HEALTH",{identity:this.state.formulaServiceIdentity,implementationSha256:h.implementationSha256,goldenVectorPass:h.goldenVectorPass,execution:"NOT_EXECUTED"})}catch(e){this.state.formulaServiceIdentity="UNEXPOSED";this.evidence("FORMULA_HEALTH",{identity:"UNEXPOSED",message:e.message,execution:"NOT_EXECUTED"})}return this.state.formulaServiceIdentity}
 selectSkills(text,max=3){const list=this.state.manifest?.skills||[],tokens=[...new Set((text.toLowerCase().match(/[a-z0-9-]{4,}/g)||[]))];const core=["leeway-context-engineering","leeway-universal-capability-kernel"];const scored=list.map(s=>({s,score:tokens.reduce((n,t)=>n+(s.id.toLowerCase().includes(t)?2:0)+(s.path.toLowerCase().includes(t)?1:0),0)+(core.includes(s.id)?1:0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.s.id.localeCompare(b.s.id));return scored.slice(0,max).map(x=>x.s)}
 async taskContext(text){const selected=this.selectSkills(text,3),chunks=[];for(const s of selected){try{const body=await getText(s.rawUrl);chunks.push("SKILL "+s.id+"\n"+body.slice(0,1800));this.evidence("SKILL_RETRIEVED",{id:s.id,path:s.path})}catch(e){this.evidence("SKILL_RETRIEVAL_FAILED",{id:s.id,message:e.message})}}return chunks.length?"TASK-SCOPED LEEWAY SKILLS:\n"+chunks.join("\n---\n"):"TASK-SCOPED LEEWAY SKILLS: none retrieved"}
 systemContext(){const m=this.state.manifest,f=this.state.formulaAuthority;return["You are Agent Lee running in LeeWay Live.","Ambient LeeWay capability field: "+(m?.skillCount??0)+" committed skills from "+(m?.branch||"unavailable")+" @ "+(m?.commit||"unknown")+".","Formula authority: "+(f?.formulaId||"unavailable")+"; service identity: "+this.state.formulaServiceIdentity+"; Formula execution: "+this.state.formulaExecution+".","Never claim Formula execution from health discovery. Never claim a skill executed merely because its document was retrieved.","Configured != executed; executed != verified."].join("\n")}
 summary(){return{skillsReachable:!!this.state.manifest,skillsDeclared:this.state.manifest?.skillCount??null,skillsCommit:this.state.manifest?.commit??null,formulaAuthorityReachable:!!this.state.formulaAuthority,formulaServiceIdentity:this.state.formulaServiceIdentity,formulaExecution:this.state.formulaExecution,boundConsumers:this.state.formulaBindings?.consumers?.map(x=>x.name)||[]}}
}