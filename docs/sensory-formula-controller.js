/*
LEEWAY SENSORY FORMULA CONTROLLER
Consumes canonical Formula authority without embedding/replacing the Formula engine.
*/
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
export const q69=rho=>clamp(Math.round(69*clamp(Number(rho)||0,0,1)),0,69);

export class SensoryFormulaController{
  constructor({
    baseUrl=localStorage.getItem("LEEWAY_FORMULA_BASE_URL")||"http://127.0.0.1:4001",
    pinnedEngineSha256="6502791BBA909D7481DB3A204F3CBF67B1DC06A4B76A73C797D709408341D63E",
    evidence=()=>{}
  }={}){
    this.baseUrl=baseUrl.replace(/\/$/,"");
    this.pinnedEngineSha256=pinnedEngineSha256.toUpperCase();
    this.evidence=evidence;
    this.state="UNEXPOSED";
    this.executionState="NOT_EXECUTED";
    this.verificationStatus="NOT_VERIFIED";
    this.health=null;
    this.history=[];
  }

  normalize(raw,scale){
    if(!(Number.isFinite(raw)&&Number.isFinite(scale)&&scale>0))throw new Error("INVALID_TELEMETRY_SCALE");
    return clamp(raw/scale,0,1);
  }

  row(values){
    if(!Array.isArray(values)||values.length!==6)throw new Error("SENSORY_FORMULA_ROW_REQUIRES_6_VALUES");
    return values.map(v=>q69(v));
  }

  pushRow(values){
    const row=this.row(values);
    this.history.push(row);
    if(this.history.length>16)this.history.shift();
    this.evidence("FORMULA_TELEMETRY_ROW",{row,historyLength:this.history.length});
    return row;
  }

  historyMatrix(){
    return this.history.map(row=>row.slice());
  }

  historyReady(){
    return this.history.length===16&&this.history.every(row=>row.length===6&&row.every(q=>Number.isInteger(q)&&q>=0&&q<=69));
  }

  async probe(){
    this.state="DISCOVERED";
    this.evidence("FORMULA_DISCOVERY",{state:this.state,baseUrl:this.baseUrl});
    try{
      const c=new AbortController();
      const timer=setTimeout(()=>c.abort(),2500);
      const r=await fetch(this.baseUrl+"/runtime/formula/v1/health",{cache:"no-store",signal:c.signal});
      clearTimeout(timer);
      if(!r.ok)throw new Error("FORMULA_HEALTH_HTTP_"+r.status);
      const h=await r.json();
      this.health=h;
      this.state="AVAILABLE";
      const observed=String(h.implementationSha256||h.engineSha256||"").toUpperCase();
      const identityMatch=Boolean(observed)&&observed===this.pinnedEngineSha256;
      this.verificationStatus=identityMatch?"IDENTITY_VERIFIED":"IDENTITY_MISMATCH_OR_UNAVAILABLE";
      this.evidence("FORMULA_HEALTH",{
        state:this.state,
        verificationStatus:this.verificationStatus,
        implementationSha256:observed||null,
        loaded:h.loaded,
        goldenVectorPass:h.goldenVectorPass
      });
      return this.status();
    }catch(error){
      this.state="UNEXPOSED";
      this.executionState="NOT_EXECUTED";
      this.verificationStatus="NOT_VERIFIED";
      this.evidence("FORMULA_HEALTH",{state:this.state,message:error.message,executionState:this.executionState});
      return this.status();
    }
  }

  authorize(){
    if(this.state!=="AVAILABLE")throw new Error("FORMULA_NOT_AVAILABLE");
    if(this.verificationStatus!=="IDENTITY_VERIFIED")throw new Error("FORMULA_IDENTITY_NOT_VERIFIED");
    this.state="AUTHORIZED";
    this.evidence("FORMULA_AUTHORIZED",{state:this.state});
    return this.status();
  }

  async evaluateWithAuthorizedAdapter(adapter){
    if(typeof adapter!=="function")throw new Error("AUTHORIZED_FORMULA_ADAPTER_REQUIRED");
    if(this.state!=="AUTHORIZED")throw new Error("FORMULA_NOT_AUTHORIZED");
    if(!this.historyReady())throw new Error("FORMULA_HISTORY_NOT_READY_16X6");

    const mapping=await adapter({
      history:this.historyMatrix(),
      authority:{
        formulaId:"LEEWAY-FORMULA-v1.0",
        adapterRequirement:"AUTHORIZED_EXTERNAL_MAPPING"
      }
    });

    if(!mapping||typeof mapping.requestBody!=="object"||Array.isArray(mapping.requestBody)){
      throw new Error("AUTHORIZED_ADAPTER_DID_NOT_RETURN_REQUEST_BODY");
    }
    if(!mapping.adapterIdentity)throw new Error("AUTHORIZED_ADAPTER_IDENTITY_REQUIRED");

    const r=await fetch(this.baseUrl+"/runtime/formula/v1/evaluate",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(mapping.requestBody)
    });
    if(!r.ok){
      this.state="FAILED";
      this.executionState="FAILED";
      throw new Error("FORMULA_EVALUATE_HTTP_"+r.status);
    }
    const result=await r.json();
    this.state="EXECUTED";
    this.executionState="EXECUTED";
    this.evidence("FORMULA_EXECUTED",{
      adapterIdentity:mapping.adapterIdentity,
      runtimeTarget:"LEEWAY_SENSORY_HARNESS",
      selectedPolicyOrAction:result.selectedPolicy||result.action||null
    });
    return{
      result,
      adapterIdentity:mapping.adapterIdentity,
      state:this.state,
      executionState:this.executionState
    };
  }

  markVerified(receipt){
    if(this.state!=="EXECUTED")throw new Error("FORMULA_NOT_EXECUTED");
    if(!receipt?.veritasStatus)throw new Error("VERITAS_STATUS_REQUIRED");
    if(receipt.veritasStatus!=="PASS")throw new Error("FORMULA_VERIFICATION_NOT_PASS");
    this.state="VERIFIED";
    this.executionState="VERIFIED";
    this.verificationStatus="VERIFIED";
    this.evidence("FORMULA_VERIFIED",{receiptId:receipt.receiptId||null});
    return this.status();
  }

  status(){
    return{
      formulaId:"LEEWAY-FORMULA-v1.0",
      baseUrl:this.baseUrl,
      state:this.state,
      executionState:this.executionState,
      verificationStatus:this.verificationStatus,
      historyLength:this.history.length,
      historyReady:this.historyReady(),
      pinnedEngineSha256:this.pinnedEngineSha256
    };
  }
}
