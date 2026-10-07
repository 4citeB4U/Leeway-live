/*
LEEWAY HEADER — DO NOT REMOVE
REGION: VERIFICATION.LIVE.RUNTIME
TAG: VERITAS.LEEWAYLIVE.SOURCE_RELAY_CONTRACT
5WH:
WHAT = Verify Live source contracts and execute its relay and browser voice guards
WHY = Keep the Pages-to-phone gate runnable without claiming physical speech proof
WHO = LeeWay Industries / Agent Lee
WHERE = tests/live-runtime-source.test.mjs
WHEN = 2026-10-07
HOW = Inspect pinned routes and exercise real adapters with controlled browser dependencies
AGENTS:
ASSESS
AUDIT
AGENT_LEE
LICENSE:
MIT
*/
import fs from "node:fs";
import assert from "node:assert/strict";

const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const app=read("docs/app.js");
const model=read("docs/model-runtime.js");
const ecosystem=read("docs/ecosystem.js");
const html=read("docs/index.html");
const bootstrap=JSON.parse(read("docs/bootstrap.json"));
const relay=read("docs/phone-relay.js");
const media=read("docs/media.js");

assert.match(app,/configureInstaller\(/,"Pages must configure the phone installer");
assert.match(app,/taskContext\(/,"existing task-scoped skill routing must remain");
assert.match(app,/connectLocal/,"existing CONNECT LOCAL path must remain");
assert.match(app,/model\.generate\(/,"text turns must invoke a real model adapter");
assert.match(app,/model\.see\(/,"vision turns must invoke a real model adapter");

assert.match(model,/@huggingface\/transformers@4\.3\.0/,"browser fallback runtime must stay pinned");
assert.match(model,/OLLAMA_MODEL/,"local Ollama routing must remain");

assert.match(ecosystem,/LEEWAY-DEVICE-BRIDGE\/main\/docs\/package-manifest\.json/,"installer must bind canonical Device Bridge package manifest");
assert.match(ecosystem,/skills-manifest\.json/,"238-skill manifest binding must remain");
assert.match(ecosystem,/Leeway-formula-live\/main\/contracts\/consumer-contract\.json/,"Formula consumer contract must remain");
assert.doesNotMatch(ecosystem,/\/evaluate["'`]/,"Pages must not directly claim or fire Formula evaluation");

assert.match(html,/id="installButton"/,"phone package download control must exist");
assert.match(html,/id="packageInfo"/,"package evidence must be visible");
assert.match(html,/id="connectLocal"/,"local runtime connector must remain visible");
assert.match(html,/id="micButton"/,"browser voice diagnostic must remain");
assert.match(html,/id="seeButton"/,"browser vision diagnostic must remain");

assert.equal(bootstrap.executionAuthority,"PHONE_LOCAL_NATIVE_PACKAGE");
assert.equal(bootstrap.repositories.deviceBridge,"https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE");
assert.equal(bootstrap.repositories.agentSkills,"https://github.com/4citeB4U/LeeWay-Agent-Skills");
assert.equal(bootstrap.repositories.formula,"https://github.com/4citeB4U/Leeway-formula-live");

console.log("LEEWAY_LIVE_GITHUB_FIRST_SOURCE_GATE=PASS");


assert.match(relay,/wss:\/\/agent-lee-x\.vercel\.app\/api\/device-relay/);
assert.match(relay,/role:"client"/);
assert.match(relay,/LEEWAY_PHONE_DEVICE_ID/);
assert.match(relay,/LEEWAY_PHONE_PAIRING_TOKEN/);
assert.match(relay,/localStorage\.setItem/);
assert.match(relay,/capability,arguments:args/);
assert.match(relay,/model\.status/);
assert.match(relay,/model\.inference/);
assert.match(relay,/PHONE_OFFLINE/);

assert.match(app,/PhoneRelayClient/);
assert.match(app,/phoneRelay\.modelStatus/);
assert.match(app,/phoneRelay\.infer/);
assert.match(app,/PHONE_LOCAL_MODEL/);
assert.match(app,/LEEWAY_FALLBACK_RUNTIME/);
assert.match(app,/answerWithPreferredModel/);
assert.match(app,/phoneRelay\.speak/,"speech must use the paired phone relay");
assert.match(relay,/this\.command\("sensory\.speak"/,"phone speech must use the sensory.speak capability");

assert.match(media,/SpeechRecognition\|\|window\.webkitSpeechRecognition/);
assert.match(media,/speechSynthesis:false/,"generic browser synthesis must remain disabled");
assert.match(media,/cloneVoice:false/,"the browser must not claim a bound clone voice");
assert.match(html,/id="phoneDeviceId"/);
assert.match(html,/id="phonePairingToken"/);
assert.match(html,/id="connectPhone"/);
assert.match(html,/id="phoneStatus"/);

console.log("LEEWAY_LIVE_PHONE_ROUTE_SOURCE_GATE=PASS");

// This is adapter contract evidence with a controlled transport, not a live phone test.
const {PhoneRelayClient}=await import("../docs/phone-relay.js");
const {BrowserMediaAdapter}=await import("../docs/media.js");
const globalNames=["WebSocket","localStorage","window","navigator"];
const originalGlobals=new Map(globalNames.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
const storage=new Map();
const sockets=[];
let browserSpeechCalls=0;

class ContractWebSocket{
  static OPEN=1;
  constructor(url){this.url=url;this.readyState=0;this.sent=[];sockets.push(this)}
  open(){this.readyState=ContractWebSocket.OPEN;this.onopen?.()}
  send(data){assert.equal(this.readyState,ContractWebSocket.OPEN);this.sent.push(JSON.parse(data))}
  receive(message){this.onmessage?.({data:JSON.stringify(message)})}
  close(){if(this.readyState===3)return;this.readyState=3;this.onclose?.()}
}

function replaceGlobal(name,value){
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
}

// Observe early so a failing assertion followed by cleanup cannot leak a rejection.
function observed(promise){promise.catch(()=>{});return promise}

async function withPairedPhone(phoneOnline,check){
  const client=new PhoneRelayClient();
  const deviceId="contract-test-phone";
  const token="test-only-not-a-real-pairing-token";
  client.saveCredentials(deviceId,token);
  try{
    let connected=false;
    const connection=observed(client.connect());
    connection.then(()=>{connected=true},()=>{});
    const socket=sockets.at(-1);
    socket.open();
    await new Promise(resolve=>setImmediate(resolve));
    const connectedBeforeAck=connected;
    const statusBeforeAck=client.connected;
    socket.receive({type:"hello-ack",phoneOnline,clientCount:1});
    const status=await connection;

    assert.equal(connectedBeforeAck,false,"socket open must wait for authentication acknowledgement");
    assert.equal(statusBeforeAck,false,"socket open must not claim authentication");
    assert.equal(socket.url,"wss://agent-lee-x.vercel.app/api/device-relay");
    assert.deepEqual(socket.sent,[{type:"hello",role:"client",deviceId,token}]);
    assert.equal(status.connected,true);
    assert.equal(status.phoneOnline,phoneOnline);
    await check(client,socket);
  }finally{
    client.disconnect();
    storage.clear();
  }
}

try{
  replaceGlobal("WebSocket",ContractWebSocket);
  replaceGlobal("localStorage",{
    getItem:key=>storage.get(key)??null,
    setItem:(key,value)=>storage.set(key,String(value)),
    removeItem:key=>storage.delete(key)
  });
  replaceGlobal("window",{speechSynthesis:{speak(){browserSpeechCalls++}}});
  replaceGlobal("navigator",{});

  const unpaired=new PhoneRelayClient();
  try{
    await assert.rejects(unpaired.speak("unpaired contract test"),{
      message:"Phone Device ID and pairing token are required"
    });
    assert.equal(sockets.length,0,"missing credentials must fail before transport creation");
  }finally{unpaired.disconnect()}

  await withPairedPhone(true,async(client,socket)=>{
    const text="LeeWay relay contract test.";
    let settled=false;
    const speech=observed(client.speak(text));
    speech.then(()=>{settled=true},()=>{settled=true});
    const command=socket.sent.at(-1);
    assert.equal(socket.sent.length,2,"speech must send one command after the hello");
    assert.equal(typeof command.id,"string");
    assert.ok(command.id.length>0);
    assert.deepEqual(command,{
      type:"command",id:command.id,capability:"sensory.speak",arguments:{text}
    });

    socket.receive({type:"result",id:"unrelated-"+command.id,ok:true,result:{}});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(settled,false,"an unrelated result must not complete speech");
    assert.equal(client.pending.has(command.id),true);

    const result={accepted:true,utteranceId:"contract-test-utterance"};
    socket.receive({type:"result",id:command.id,ok:true,result});
    assert.deepEqual(await speech,result,"speech must return its matching result");
    assert.equal(client.pending.size,0,"completed commands must be released");
  });

  await withPairedPhone(false,async(client,socket)=>{
    await assert.rejects(client.speak("offline contract test"),{message:"PHONE_OFFLINE"});
    assert.equal(socket.sent.length,1,"an offline phone must not receive a command");
    assert.equal(client.pending.size,0);
  });

  await withPairedPhone(true,async(client,socket)=>{
    const speech=observed(client.speak("failure contract test"));
    const command=socket.sent.at(-1);
    const rejected=assert.rejects(speech,{message:"CONTRACT_TEST_SPEECH_REJECTED"});
    socket.receive({
      type:"result",id:command.id,ok:false,error:"CONTRACT_TEST_SPEECH_REJECTED"
    });
    await rejected;
    assert.equal(client.pending.size,0,"failed commands must be released");

    const interrupted=observed(client.speak("disconnect contract test"));
    const disconnected=assert.rejects(interrupted,{message:"Phone relay disconnected"});
    client.disconnect();
    await disconnected;
    assert.equal(client.pending.size,0,"disconnect must release in-flight commands");
    assert.equal(client.connected,false);
  });
  console.log("LEEWAY_LIVE_RELAY_ADAPTER_CONTRACT_GATE=PASS");

  const browserMedia=new BrowserMediaAdapter();
  assert.equal(browserMedia.capabilities().speechSynthesis,false);
  assert.equal(browserMedia.capabilities().cloneVoice,false);
  assert.throws(()=>browserMedia.speak("browser guard test"),{
    message:"LEEWAY_CLONE_VOICE_NOT_BOUND"
  });
  assert.equal(browserSpeechCalls,0,"browser synthesis must not bypass the clone-voice guard");
  console.log("LEEWAY_LIVE_BROWSER_VOICE_GUARD_GATE=PASS");
}finally{
  for(const[name,descriptor]of originalGlobals){
    if(descriptor)Object.defineProperty(globalThis,name,descriptor);
    else delete globalThis[name];
  }
}

console.log("LEEWAY_LIVE_SOURCE_AND_ADAPTER_CONTRACT_GATE=PASS");
