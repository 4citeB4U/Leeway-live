/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.RUNTIME.BINDING
TAG: CORE.RUNTIME.LEEWAYLIVE.ECOSYSTEM
5WH:
WHAT = LeeWay Live bindings to Skills and centralized Formula authority
WHY = Connects the live model to canonical ecosystem metadata without copying or inventing Formula logic
WHO = LeeWay Industries / Agent Lee
WHERE = docs/ecosystem.js
WHEN = 2026-09-23
HOW = Read-only public contract retrieval plus optional local Formula health discovery
AGENTS: ASSESS AUDIT AGENT_LEE VERITAS
LICENSE: MIT
*/
const RAW="https://raw.githubusercontent.com/4citeB4U/";
const sources={
  skillsRegistry:{url:RAW+"LeeWay-Agent-Skills/main/scripts/skills-registry.json",type:"json"},
  capabilityManifold:{url:RAW+"LeeWay-Agent-Skills/main/config/leeway-capability-manifold.yaml",type:"text"},
  coreGovernance:{url:RAW+"LeeWay-Agent-Skills/main/config/leeway-core-governance.yaml",type:"text"},
  formulaAuthority:{url:RAW+"Leeway-formula-live/main/authority/formula-authority.json",type:"json"},
  formulaConsumer:{url:RAW+"Leeway-formula-live/main/contracts/consumer-contract.json",type:"json"},
  formulaBindings:{url:RAW+"Leeway-formula-live/main/contracts/ecosystem-bindings.json",type:"json"}
};
async function retrieve(source){
  const r=await fetch(source.url,{cache:"no-store"});
  if(!r.ok)throw new Error(source.url+" -> "+r.status);
  return source.type==="json"?r.json():r.text();
}
export class EcosystemBinding{
  constructor(evidence=()=>{}){
    this.evidence=evidence;
    this.state={formulaRuntime:"UNEXPOSED"};
  }
  async hydrate(){
    for(const [key,source] of Object.entries(sources)){
      try{
        this.state[key]=await retrieve(source);
        this.evidence("BINDING_OK",{binding:key});
      }catch(error){
        this.state[key]=null;
        this.evidence("BINDING_ERROR",{binding:key,message:error.message});
      }
    }
    await this.probeFormula();
    return this.state;
  }
  async probeFormula(){
    const base=localStorage.getItem("LEEWAY_FORMULA_BASE_URL")||"http://127.0.0.1:4001";
    const path=this.state.formulaConsumer?.endpoints?.health?.path||"/runtime/formula/v1/health";
    try{
      const controller=new AbortController();
      setTimeout(()=>controller.abort(),1500);
      const r=await fetch(base+path,{signal:controller.signal,cache:"no-store"});
      if(!r.ok)throw new Error("HTTP "+r.status);
      this.state.formulaHealth=await r.json();
      this.state.formulaRuntime="AVAILABLE";
      this.evidence("FORMULA_DISCOVERY",{
        state:"AVAILABLE",
        base,
        formula:this.state.formulaHealth?.formula,
        implementationSha256:this.state.formulaHealth?.implementationSha256
      });
    }catch(error){
      this.state.formulaRuntime="UNEXPOSED";
      this.evidence("FORMULA_DISCOVERY",{state:"UNEXPOSED",message:error.message});
    }
    return this.state.formulaRuntime;
  }
  systemContext(){
    const formula=this.state.formulaAuthority;
    return[
      "LeeWay Live is connected read-only to the canonical LeeWay Agent Skills and Formula authority repositories.",
      "Agent Skills governance and capability-manifold contracts are reachable: "+Boolean(this.state.capabilityManifold&&this.state.coreGovernance)+".",
      "Formula authority: "+(formula?.formulaId||"unavailable")+"; authority status: "+(formula?.status||"unavailable")+"; runtime discovery: "+this.state.formulaRuntime+".",
      "Repository binding is not skill execution. Formula availability is not Formula execution.",
      "Never claim Formula execution unless an authorized evaluate call is separately executed and verified.",
      "Configured != executed; executed != verified."
    ].join("\n");
  }
  summary(){
    return{
      skillsRegistryReachable:!!this.state.skillsRegistry,
      capabilityManifoldReachable:!!this.state.capabilityManifold,
      coreGovernanceReachable:!!this.state.coreGovernance,
      formulaAuthorityReachable:!!this.state.formulaAuthority,
      formulaRuntime:this.state.formulaRuntime,
      formulaHealthStatus:this.state.formulaHealth?.status||null,
      formulaImplementationSha256:this.state.formulaHealth?.implementationSha256||null,
      boundConsumers:this.state.formulaBindings?.consumers?.map(x=>x.name)||[]
    };
  }
}