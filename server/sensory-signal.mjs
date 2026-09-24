#!/usr/bin/env node
/*
LEEWAY SENSORY SIGNALING SERVER
Zero external runtime dependencies.
Control/signaling only. It never becomes media authority.
*/
import http from "node:http";
import crypto from "node:crypto";

const PORT=Number(process.env.LEEWAY_SENSORY_SIGNAL_PORT||8787);
const HOST=process.env.LEEWAY_SENSORY_SIGNAL_HOST||"0.0.0.0";
const MAX_BODY=256*1024;
const PEER_TTL_MS=Number(process.env.LEEWAY_SENSORY_PEER_TTL_MS||120000);
const queues=new Map();
const waiters=new Map();
const peers=new Map();
const sessions=new Map();

const now=()=>Date.now();
const key=(sessionId,peerId)=>sessionId+"::"+peerId;
const json=(res,status,value)=>{
  const body=JSON.stringify(value);
  res.writeHead(status,{
    "content-type":"application/json",
    "cache-control":"no-store",
    "access-control-allow-origin":"*",
    "access-control-allow-headers":"content-type",
    "access-control-allow-methods":"GET,POST,OPTIONS"
  });
  res.end(body);
};
const validId=v=>typeof v==="string"&&/^[A-Za-z0-9._:-]{8,128}$/.test(v);
const validSecret=v=>typeof v==="string"&&v.length>=24&&v.length<=256;
const secretHash=v=>crypto.createHash("sha256").update(v,"utf8").digest("hex");
const authorizeSession=(sessionId,secret)=>{
  if(!validSecret(secret))return false;
  const h=secretHash(secret),existing=sessions.get(sessionId);
  if(!existing){sessions.set(sessionId,{secretHash:h,createdAt:now()});return true}
  return crypto.timingSafeEqual(Buffer.from(existing.secretHash,"hex"),Buffer.from(h,"hex"));
};
const touch=(sessionId,peerId,role,capabilities={})=>{
  peers.set(key(sessionId,peerId),{sessionId,peerId,role,capabilities,lastSeen:now()});
};
const enqueue=(sessionId,toPeerId,message)=>{
  const k=key(sessionId,toPeerId);
  const waiter=waiters.get(k);
  if(waiter){
    waiters.delete(k);
    clearTimeout(waiter.timer);
    return json(waiter.res,200,{messages:[message]});
  }
  const q=queues.get(k)||[];
  q.push(message);
  if(q.length>256)q.shift();
  queues.set(k,q);
};
const readBody=req=>new Promise((resolve,reject)=>{
  let size=0,buf="";
  req.setEncoding("utf8");
  req.on("data",chunk=>{
    size+=Buffer.byteLength(chunk);
    if(size>MAX_BODY){reject(new Error("BODY_TOO_LARGE"));req.destroy();return}
    buf+=chunk;
  });
  req.on("end",()=>{
    try{resolve(buf?JSON.parse(buf):{})}catch{reject(new Error("INVALID_JSON"))}
  });
  req.on("error",reject);
});
const cleanup=()=>{
  const cutoff=now()-PEER_TTL_MS;
  for(const [k,p] of peers)if(p.lastSeen<cutoff){
    peers.delete(k);queues.delete(k);
    const waiter=waiters.get(k);
    if(waiter){clearTimeout(waiter.timer);json(waiter.res,410,{error:"PEER_EXPIRED"});waiters.delete(k)}
  }
};
setInterval(cleanup,30000).unref();

const server=http.createServer(async(req,res)=>{
  if(req.method==="OPTIONS"){res.writeHead(204,{
    "access-control-allow-origin":"*",
    "access-control-allow-headers":"content-type",
    "access-control-allow-methods":"GET,POST,OPTIONS"
  });return res.end()}

  const url=new URL(req.url||"/","http://localhost");

  if(req.method==="GET"&&url.pathname==="/health"){
    return json(res,200,{
      ok:true,
      service:"leeway-sensory-signal",
      authority:"LEEWAY_CONTROL_PLANE",
      mediaAuthority:false,
      peers:peers.size,
      sessions:sessions.size,
      transport:"HTTP_LONG_POLL_SIGNALING",
      externalApiKeyRequired:false
    });
  }

  if(req.method==="POST"&&url.pathname==="/join"){
    try{
      const b=await readBody(req);
      if(!validId(b.sessionId)||!validId(b.peerId))return json(res,400,{error:"INVALID_ID"});
      if(!authorizeSession(b.sessionId,b.sessionSecret))return json(res,403,{error:"SESSION_AUTH_FAILED"});
      const role=String(b.role||"peer");
      touch(b.sessionId,b.peerId,role,b.capabilities||{});
      const sessionPeers=[...peers.values()]
        .filter(p=>p.sessionId===b.sessionId&&p.peerId!==b.peerId)
        .map(p=>({peerId:p.peerId,role:p.role,capabilities:p.capabilities}));
      return json(res,200,{
        ok:true,
        sessionId:b.sessionId,
        peerId:b.peerId,
        peers:sessionPeers,
        serverTime:now()
      });
    }catch(e){return json(res,400,{error:e.message})}
  }

  if(req.method==="POST"&&url.pathname==="/signal"){
    try{
      const b=await readBody(req);
      if(!validId(b.sessionId)||!validId(b.fromPeerId)||!validId(b.toPeerId))
        return json(res,400,{error:"INVALID_ID"});
      if(!authorizeSession(b.sessionId,b.sessionSecret))return json(res,403,{error:"SESSION_AUTH_FAILED"});
      const from=peers.get(key(b.sessionId,b.fromPeerId));
      if(!from)return json(res,403,{error:"FROM_PEER_NOT_JOINED"});
      touch(b.sessionId,b.fromPeerId,from.role,from.capabilities);
      const event={
        eventId:crypto.randomUUID(),
        sessionId:b.sessionId,
        fromPeerId:b.fromPeerId,
        toPeerId:b.toPeerId,
        type:b.type,
        payload:b.payload??null,
        monotonicTimestamp:performance.now(),
        wallTime:now()
      };
      enqueue(b.sessionId,b.toPeerId,event);
      return json(res,202,{ok:true,eventId:event.eventId});
    }catch(e){return json(res,400,{error:e.message})}
  }

  if(req.method==="GET"&&url.pathname==="/poll"){
    const sessionId=url.searchParams.get("sessionId")||"";
    const peerId=url.searchParams.get("peerId")||"";
    const sessionSecret=url.searchParams.get("sessionSecret")||"";
    if(!validId(sessionId)||!validId(peerId))return json(res,400,{error:"INVALID_ID"});
    if(!authorizeSession(sessionId,sessionSecret))return json(res,403,{error:"SESSION_AUTH_FAILED"});
    const peer=peers.get(key(sessionId,peerId));
    if(!peer)return json(res,403,{error:"PEER_NOT_JOINED"});
    touch(sessionId,peerId,peer.role,peer.capabilities);
    const k=key(sessionId,peerId),q=queues.get(k)||[];
    if(q.length){
      queues.set(k,[]);
      return json(res,200,{messages:q});
    }
    const timer=setTimeout(()=>{
      waiters.delete(k);
      json(res,200,{messages:[]});
    },25000);
    const old=waiters.get(k);
    if(old){clearTimeout(old.timer);json(old.res,409,{error:"POLL_REPLACED"})}
    waiters.set(k,{res,timer});
    req.on("close",()=>{
      const w=waiters.get(k);
      if(w?.res===res){clearTimeout(w.timer);waiters.delete(k)}
    });
    return;
  }

  json(res,404,{error:"NOT_FOUND"});
});

server.listen(PORT,HOST,()=>{
  process.stdout.write(JSON.stringify({
    event:"LEEWAY_SENSORY_SIGNAL_READY",
    host:HOST,port:PORT,externalApiKeyRequired:false
  })+"\n");
});
