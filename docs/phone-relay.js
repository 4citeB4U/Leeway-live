/*
LEEWAY HEADER — DO NOT REMOVE
REGION: TRANSPORT.PHONE.RELAY
TAG: TRANSPORT.LEEWAYLIVE.PHONERELAY
WHAT = Browser client for the existing LeeWay phone relay
WHY = Routes LeeWay Live voice/text turns to the already-installed phone-local model without requiring a new APK
WHO = LeeWay Industries / Agent Lee
WHERE = docs/phone-relay.js
HOW = Owner-provided device id + pairing token, persisted locally in the browser, authenticated over WSS
*/
const RELAY_URL="wss://agent-lee-x.vercel.app/api/device-relay";
const KEY_DEVICE="LEEWAY_PHONE_DEVICE_ID";
const KEY_TOKEN="LEEWAY_PHONE_PAIRING_TOKEN";

function makeId(){
  if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
  return "cmd-"+Date.now()+"-"+Math.random().toString(16).slice(2);
}

export class PhoneRelayClient{
  constructor(evidence=()=>{}){
    this.evidence=evidence;
    this.ws=null;
    this.connected=false;
    this.phoneOnline=false;
    this.pending=new Map();
    this.reconnectTimer=null;
    this.manualStop=false;
  }

  credentials(){
    return{
      deviceId:localStorage.getItem(KEY_DEVICE)||"",
      token:localStorage.getItem(KEY_TOKEN)||""
    };
  }

  saveCredentials(deviceId,token){
    const d=(deviceId||"").trim();
    const t=(token||"").trim();
    if(d.length<8)throw new Error("Device ID is too short");
    if(t.length<20)throw new Error("Pairing token is too short");
    localStorage.setItem(KEY_DEVICE,d);
    localStorage.setItem(KEY_TOKEN,t);
    this.evidence("PHONE_PAIRING_SAVED",{deviceId:d});
  }

  clearCredentials(){
    localStorage.removeItem(KEY_DEVICE);
    localStorage.removeItem(KEY_TOKEN);
    this.disconnect("credentials_cleared");
  }

  async connect(){
    const {deviceId,token}=this.credentials();
    if(!deviceId||!token)throw new Error("Phone Device ID and pairing token are required");
    if(this.ws&&this.ws.readyState===WebSocket.OPEN&&this.connected)return this.status();

    this.manualStop=false;
    this.disconnect("reconnect");

    await new Promise((resolve,reject)=>{
      const ws=new WebSocket(RELAY_URL);
      this.ws=ws;
      let settled=false;

      const timer=setTimeout(()=>{
        if(!settled){
          settled=true;
          try{ws.close()}catch{}
          reject(new Error("Phone relay connection timed out"));
        }
      },10000);

      ws.onopen=()=>{
        this.evidence("PHONE_RELAY_SOCKET_OPEN",{deviceId});
        ws.send(JSON.stringify({type:"hello",role:"client",deviceId,token}));
      };

      ws.onmessage=event=>{
        let msg;
        try{msg=JSON.parse(event.data)}catch{return}

        if(msg.type==="hello-ack"){
          this.connected=true;
          this.phoneOnline=Boolean(msg.phoneOnline);
          this.evidence("PHONE_RELAY_AUTHENTICATED",{deviceId,phoneOnline:this.phoneOnline,clientCount:msg.clientCount});
          if(!settled){
            settled=true;
            clearTimeout(timer);
            resolve(this.status());
          }
          return;
        }

        if(msg.type==="result"&&msg.id){
          const pending=this.pending.get(msg.id);
          if(!pending)return;
          this.pending.delete(msg.id);
          clearTimeout(pending.timer);
          if(msg.ok){
            this.evidence("PHONE_COMMAND_RESULT",{id:msg.id,ok:true});
            pending.resolve(msg.result);
          }else{
            this.evidence("PHONE_COMMAND_RESULT",{id:msg.id,ok:false,error:msg.error});
            pending.reject(new Error(msg.error||"PHONE_COMMAND_FAILED"));
          }
          return;
        }

        if(msg.type==="error"){
          this.evidence("PHONE_RELAY_ERROR",{error:msg.error});
          if(!settled){
            settled=true;
            clearTimeout(timer);
            reject(new Error(msg.error||"PHONE_RELAY_ERROR"));
          }
        }
      };

      ws.onerror=()=>{
        this.evidence("PHONE_RELAY_SOCKET_ERROR");
        if(!settled){
          settled=true;
          clearTimeout(timer);
          reject(new Error("Phone relay socket error"));
        }
      };

      ws.onclose=()=>{
        this.connected=false;
        this.phoneOnline=false;
        this.evidence("PHONE_RELAY_CLOSED");
        for(const [id,p] of this.pending){
          clearTimeout(p.timer);
          p.reject(new Error("Phone relay disconnected"));
          this.pending.delete(id);
        }
        if(!this.manualStop&&this.credentials().deviceId&&this.credentials().token){
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer=setTimeout(()=>this.connect().catch(()=>{}),3000);
        }
      };
    });

    return this.status();
  }

  disconnect(reason="manual"){
    this.manualStop=reason!=="reconnect";
    clearTimeout(this.reconnectTimer);
    if(this.ws){
      try{this.ws.close(1000,reason)}catch{}
    }
    this.ws=null;
    this.connected=false;
    this.phoneOnline=false;
  }

  status(){
    const {deviceId,token}=this.credentials();
    return{
      configured:Boolean(deviceId&&token),
      deviceId:deviceId||null,
      connected:this.connected,
      phoneOnline:this.phoneOnline,
      relayUrl:RELAY_URL
    };
  }

  async command(capability,args={},timeoutMs=120000){
    if(!this.connected||!this.ws||this.ws.readyState!==WebSocket.OPEN){
      await this.connect();
    }
    if(!this.phoneOnline)throw new Error("PHONE_OFFLINE");

    const id=makeId();
    const payload={type:"command",id,capability,arguments:args};
    this.evidence("PHONE_COMMAND_SENT",{id,capability});

    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{
        this.pending.delete(id);
        reject(new Error("PHONE_COMMAND_TIMEOUT"));
      },timeoutMs);
      this.pending.set(id,{resolve,reject,timer});
      this.ws.send(JSON.stringify(payload));
    });
  }

  async modelStatus(){
    return this.command("model.status",{},30000);
  }

  async infer(prompt){
    const result=await this.command("model.inference",{prompt},180000);
    if(result?.ok===false)throw new Error(result.error||"PHONE_MODEL_FAILED");
    return result;
  }
}
