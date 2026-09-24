/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.RUNTIME.BINDING
TAG: CORE.RUNTIME.LEEWAYLIVE.ECOSYSTEM
5WH:
WHAT = GitHub-first bindings for LeeWay Live, Device Bridge, Agent Skills, and Formula authority
WHY = Makes GitHub Pages the bootstrap/distribution front door while preserving phone-local execution authority
WHO = LeeWay Industries / Agent Lee
WHERE = docs/ecosystem.js
WHEN = 2026-09-23
HOW = Read-only GitHub contract retrieval, package discovery, and evidence-first Formula discovery
AGENTS: ASSESS AUDIT AGENT_LEE VERITAS
LICENSE: MIT
*/
const RAW="https://raw.githubusercontent.com/4citeB4U/";
const DEVICE_PAGES="https://4citeb4u.github.io/LEEWAY-DEVICE-BRIDGE/";
const sources={
  bootstrap:{url:"./bootstrap.json",type:"json"},
  devicePackageManifest:{url:RAW+"LEEWAY-DEVICE-BRIDGE/main/docs/package-manifest.json",type:"json"},
  deviceEntrypoint:{url:RAW+"LEEWAY-DEVICE-BRIDGE/main/docs/llm-entrypoint.json",type:"json"},
  deviceRuntimeContract:{url:RAW+"LEEWAY-DEVICE-BRIDGE/main/docs/runtime-contract.json",type:"json"},
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
function absoluteDeviceDownload(relative){
  if(!relative)return null;
  return new URL(relative,DEVICE_PAGES).href;
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
    this.state.androidPackage=this.resolveAndroidPackage();
    await this.probeFormula();
    return this.state;
  }
  resolveAndroidPackage(){
    const packages=this.state.devicePackageManifest?.packages||[];
    const candidates=packages.filter(p=>p.platform==="android"&&p.downloadUrl);
    const pkg=candidates.sort((a,b)=>(b.versionCode||0)-(a.versionCode||0))[0]||null;
    if(!pkg)return null;
    const resolved={...pkg,absoluteDownloadUrl:absoluteDeviceDownload(pkg.downloadUrl)};
    this.evidence("ANDROID_PACKAGE_DISCOVERED",{
      id:resolved.id,
      versionName:resolved.versionName,
      versionCode:resolved.versionCode,
      sizeBytes:resolved.sizeBytes,
      sha256:resolved.sha256,
      url:resolved.absoluteDownloadUrl
    });
    return resolved;
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
      this.evidence("FORMULA_DISCOVERY",{state:"AVAILABLE",base,formula:this.state.formulaHealth?.formula,implementationSha256:this.state.formulaHealth?.implementationSha256});
    }catch(error){
      this.state.formulaRuntime="UNEXPOSED";
      this.evidence("FORMULA_DISCOVERY",{state:"UNEXPOSED",message:error.message});
    }
    return this.state.formulaRuntime;
  }
  systemContext(){
    const formula=this.state.formulaAuthority;
    const bridge=this.state.deviceEntrypoint;
    return[
      "LeeWay Live is GitHub-first. GitHub Pages distributes; the installed phone package executes.",
      "The canonical Android sensory-harness authority is 4citeB4U/LEEWAY-DEVICE-BRIDGE.",
      "Agent Skills governance and capability-manifold contracts are reachable: "+Boolean(this.state.capabilityManifold&&this.state.coreGovernance)+".",
      "Device Bridge contract is reachable: "+Boolean(bridge)+".",
      "Formula authority: "+(formula?.formulaId||"unavailable")+"; authority status: "+(formula?.status||"unavailable")+"; runtime discovery: "+this.state.formulaRuntime+".",
      "Repository binding is not capability execution. Formula availability is not Formula execution.",
      "Never claim execution without phone/runtime evidence and receipts.",
      "Configured != executed; executed != verified."
    ].join("\n");
  }
  summary(){
    return{
      bootstrapReachable:!!this.state.bootstrap,
      devicePackageReachable:!!this.state.androidPackage,
      devicePackageVersion:this.state.androidPackage?.versionName||null,
      devicePackageSha256:this.state.androidPackage?.sha256||null,
      deviceEntrypointReachable:!!this.state.deviceEntrypoint,
      deviceRuntimeContractReachable:!!this.state.deviceRuntimeContract,
      skillsRegistryReachable:!!this.state.skillsRegistry,
      capabilityManifoldReachable:!!this.state.capabilityManifold,
      coreGovernanceReachable:!!this.state.coreGovernance,
      formulaAuthorityReachable:!!this.state.formulaAuthority,
      formulaRuntime:this.state.formulaRuntime,
      boundConsumers:this.state.formulaBindings?.consumers?.map(x=>x.name)||[]
    };
  }
}
