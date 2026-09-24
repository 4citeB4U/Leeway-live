/*
LEEWAY UNIVERSAL SENSORY FABRIC — browser/device reference adapter
No hosted realtime service. No third-party API key.
Media: native WebRTC. Control: LeeWay-owned signaling + Universal Voice Bus.
*/
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const makeId=(prefix="peer")=>prefix+"-"+(crypto.randomUUID?.()||Date.now()+"-"+Math.random().toString(16).slice(2));
const nowMono=()=>performance.now();

export class LeeWaySensoryFabric{
  constructor({
    signalingBase,
    sessionId,
    sessionSecret,
    peerId=makeId("device"),
    role="device",
    capabilities={},
    iceServers=[],
    evidence=()=>{}
  }){
    if(!signalingBase)throw new Error("signalingBase required");
    if(!sessionId)throw new Error("sessionId required");
    if(!sessionSecret)throw new Error("sessionSecret required");
    this.signalingBase=signalingBase.replace(/\/$/,"");
    this.sessionId=sessionId;
    this.sessionSecret=sessionSecret;
    this.peerId=peerId;
    this.role=role;
    this.capabilities=capabilities;
    this.iceServers=iceServers;
    this.evidence=evidence;
    this.pc=null;
    this.data=null;
    this.localStream=null;
    this.remoteStream=new MediaStream();
    this.remotePeerId=null;
    this.polling=false;
    this.closed=false;
    this.generationEpoch=0;
    this.pendingCandidates=[];
    this.listeners=new Map();
  }

  on(event,fn){
    const list=this.listeners.get(event)||[];
    list.push(fn);this.listeners.set(event,list);
    return()=>this.listeners.set(event,(this.listeners.get(event)||[]).filter(x=>x!==fn));
  }
  emit(event,value){
    for(const fn of this.listeners.get(event)||[])try{fn(value)}catch{}
  }

  async request(path,options={}){
    const res=await fetch(this.signalingBase+path,{
      cache:"no-store",
      ...options,
      headers:{"content-type":"application/json",...(options.headers||{})}
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(body.error||("HTTP_"+res.status));
    return body;
  }

  async join(){
    const joined=await this.request("/join",{
      method:"POST",
      body:JSON.stringify({
        sessionId:this.sessionId,
        sessionSecret:this.sessionSecret,
        peerId:this.peerId,
        role:this.role,
        capabilities:this.capabilities
      })
    });
    this.evidence("SENSORY_SESSION_JOINED",{sessionId:this.sessionId,peerId:this.peerId,role:this.role,peers:joined.peers});
    this.startPolling();
    return joined;
  }

  async createPeer(remotePeerId,{initiator=false}={}){
    this.remotePeerId=remotePeerId;
    const pc=new RTCPeerConnection({iceServers:this.iceServers});
    this.pc=pc;

    pc.onicecandidate=e=>{
      if(e.candidate)this.signal(remotePeerId,"ice-candidate",e.candidate.toJSON()).catch(err=>this.evidence("SENSORY_SIGNAL_ERROR",{message:err.message}));
    };

    pc.onconnectionstatechange=()=>{
      this.evidence("SENSORY_PC_STATE",{state:pc.connectionState,remotePeerId});
      this.emit("connectionstatechange",pc.connectionState);
    };

    pc.oniceconnectionstatechange=()=>this.evidence("SENSORY_ICE_STATE",{state:pc.iceConnectionState});
    pc.onsignalingstatechange=()=>this.evidence("SENSORY_SIGNALING_STATE",{state:pc.signalingState});

    pc.ontrack=e=>{
      for(const track of e.streams[0]?.getTracks?.()||[e.track]){
        if(!this.remoteStream.getTracks().some(t=>t.id===track.id))this.remoteStream.addTrack(track);
      }
      this.evidence("SENSORY_REMOTE_TRACK",{kind:e.track.kind,id:e.track.id});
      this.emit("track",e.track);
      this.emit("remotestream",this.remoteStream);
    };

    if(this.localStream){
      for(const track of this.localStream.getTracks())pc.addTrack(track,this.localStream);
    }

    if(initiator){
      this.setupDataChannel(pc.createDataChannel("leeway-universal-voice-bus",{ordered:true}));
      const offer=await pc.createOffer();
      await pc.setLocalDescription(offer);
      await this.signal(remotePeerId,"sdp-offer",pc.localDescription);
    }else{
      pc.ondatachannel=e=>this.setupDataChannel(e.channel);
    }

    return pc;
  }

  setupDataChannel(channel){
    this.data=channel;
    channel.onopen=()=>{
      this.evidence("UVB_CHANNEL_OPEN",{label:channel.label});
      this.emit("controlopen",true);
      this.sendBus("SEMANTIC_EVENT",{kind:"CAPABILITY_NEGOTIATION",capabilities:this.capabilities});
    };
    channel.onclose=()=>this.evidence("UVB_CHANNEL_CLOSED",{});
    channel.onerror=e=>this.evidence("UVB_CHANNEL_ERROR",{message:e?.message||"data channel error"});
    channel.onmessage=e=>{
      let msg;
      try{msg=JSON.parse(e.data)}catch{return}
      if(msg.generationEpoch!==undefined&&msg.generationEpoch<this.generationEpoch){
        this.evidence("UVB_STALE_EVENT_REJECTED",{eventId:msg.eventId,eventEpoch:msg.generationEpoch,activeEpoch:this.generationEpoch});
        return;
      }
      if(msg.eventType==="CONTROL_CANCEL"&&msg.generationEpoch>=this.generationEpoch){
        this.generationEpoch=msg.generationEpoch;
      }
      this.emit("bus",msg);
      this.emit(msg.eventType,msg);
    };
  }

  sendBus(eventType,payload={},source=this.peerId){
    if(!this.data||this.data.readyState!=="open")throw new Error("UVB_DATA_CHANNEL_NOT_OPEN");
    const event={
      sessionId:this.sessionId,
      eventId:makeId("evt"),
      eventType,
      monotonicTimestamp:nowMono(),
      generationEpoch:this.generationEpoch,
      source,
      provenance:{transport:"WEBRTC_DATA_CHANNEL",role:this.role},
      payload
    };
    this.data.send(JSON.stringify(event));
    this.evidence("UVB_EVENT_SENT",{eventType,eventId:event.eventId,generationEpoch:this.generationEpoch});
    return event;
  }

  cancel(reason="barge_in"){
    this.generationEpoch++;
    try{this.sendBus("CONTROL_CANCEL",{reason})}catch{}
    this.evidence("SENSORY_GENERATION_INVALIDATED",{generationEpoch:this.generationEpoch,reason});
    this.emit("cancel",{generationEpoch:this.generationEpoch,reason});
    return this.generationEpoch;
  }

  async signal(toPeerId,type,payload){
    return this.request("/signal",{
      method:"POST",
      body:JSON.stringify({
        sessionId:this.sessionId,
        sessionSecret:this.sessionSecret,
        fromPeerId:this.peerId,
        toPeerId,
        type,
        payload
      })
    });
  }

  async handleSignal(msg){
    if(msg.fromPeerId===this.peerId)return;
    const remote=msg.fromPeerId;

    if(msg.type==="sdp-offer"){
      if(!this.pc)await this.createPeer(remote,{initiator:false});
      await this.pc.setRemoteDescription(msg.payload);
      for(const c of this.pendingCandidates.splice(0))await this.pc.addIceCandidate(c);
      const answer=await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      await this.signal(remote,"sdp-answer",this.pc.localDescription);
      return;
    }

    if(msg.type==="sdp-answer"){
      if(!this.pc)throw new Error("ANSWER_WITHOUT_PEER_CONNECTION");
      await this.pc.setRemoteDescription(msg.payload);
      for(const c of this.pendingCandidates.splice(0))await this.pc.addIceCandidate(c);
      return;
    }

    if(msg.type==="ice-candidate"){
      const candidate=new RTCIceCandidate(msg.payload);
      if(this.pc?.remoteDescription)await this.pc.addIceCandidate(candidate);
      else this.pendingCandidates.push(candidate);
      return;
    }

    if(msg.type==="control"){
      this.emit("signal-control",msg.payload);
    }
  }

  async startPolling(){
    if(this.polling)return;
    this.polling=true;
    while(!this.closed){
      try{
        const q=new URLSearchParams({
          sessionId:this.sessionId,
          peerId:this.peerId,
          sessionSecret:this.sessionSecret
        });
        const result=await this.request("/poll?"+q.toString());
        for(const msg of result.messages||[])await this.handleSignal(msg);
      }catch(error){
        this.evidence("SENSORY_POLL_ERROR",{message:error.message});
        await sleep(1000);
      }
    }
    this.polling=false;
  }

  async capture({audio=true,video=false,screen=false}={}){
    if(!navigator.mediaDevices?.getUserMedia)throw new Error("MEDIA_CAPTURE_UNAVAILABLE");
    const base=await navigator.mediaDevices.getUserMedia({audio,video});
    const tracks=[...base.getTracks()];
    if(screen){
      if(!navigator.mediaDevices.getDisplayMedia)throw new Error("SCREEN_CAPTURE_UNAVAILABLE");
      const ds=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
      tracks.push(...ds.getTracks());
    }
    this.localStream=new MediaStream(tracks);
    if(this.pc){
      for(const track of tracks)this.pc.addTrack(track,this.localStream);
    }
    this.evidence("SENSORY_CAPTURE_READY",{
      audioTracks:this.localStream.getAudioTracks().length,
      videoTracks:this.localStream.getVideoTracks().length
    });
    return this.localStream;
  }

  addOutputTrack(track,stream=new MediaStream([track])){
    if(!this.pc)throw new Error("PEER_CONNECTION_NOT_READY");
    return this.pc.addTrack(track,stream);
  }

  attachRemoteAudio(element){
    element.autoplay=true;
    element.playsInline=true;
    element.srcObject=this.remoteStream;
    return element.play?.().catch(()=>{});
  }

  stats(){
    return this.pc?.getStats?.()||Promise.resolve(new Map());
  }

  close(){
    this.closed=true;
    this.polling=false;
    try{this.data?.close()}catch{}
    try{this.pc?.close()}catch{}
    for(const track of this.localStream?.getTracks?.()||[])track.stop();
    this.localStream=null;
    this.evidence("SENSORY_SESSION_CLOSED",{});
  }
}

export function createLeeWaySessionSecret(){
  const bytes=new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
}
