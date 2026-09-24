import assert from "node:assert/strict";
import fs from "node:fs";
import { q69, SensoryFormulaController } from "../docs/sensory-formula-controller.js";

const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const architecture=read("architecture/UNIVERSAL-SENSORY-HARNESS-V1.md");
const contract=JSON.parse(read("docs/model-sensory-contract-v1.json"));
const entry=JSON.parse(read("docs/sensory-entrypoint.json"));
const policy=JSON.parse(read("docs/formula-sensory-policy-v1.json"));
const fabric=read("docs/sensory-fabric.js");
const signal=read("server/sensory-signal.mjs");
const ecosystem=read("docs/ecosystem.js");
const bootstrap=JSON.parse(read("docs/bootstrap.json"));

assert.doesNotMatch(architecture,/LiveKit/i,"hosted realtime substrate must not remain canonical");
assert.equal(contract.serviceDependencies.paidThirdPartyRealtimeService,false);
assert.equal(contract.serviceDependencies.thirdPartyRealtimeApiKey,false);
assert.equal(entry.serviceDependencies.paidThirdPartyRealtimeService,false);
assert.equal(entry.serviceDependencies.externalRealtimeApiKey,false);

assert.equal(contract.transport.mediaPreferred,"NATIVE_WEBRTC_RTP_SRTP");
assert.equal(entry.runtime.mediaTransport,"NATIVE_WEBRTC_RTP_SRTP");
assert.match(fabric,/RTCPeerConnection/);
assert.match(fabric,/getUserMedia/);
assert.match(fabric,/getDisplayMedia/);
assert.match(fabric,/createDataChannel\("leeway-universal-voice-bus"/);
assert.match(fabric,/CONTROL_CANCEL/);
assert.match(fabric,/generationEpoch/);

assert.match(signal,/node:http/);
assert.match(signal,/node:crypto/);
assert.doesNotMatch(signal,/from ["'](ws|express|socket\.io|livekit)/i);
assert.match(signal,/SESSION_AUTH_FAILED/);
assert.match(signal,/timingSafeEqual/);
assert.match(signal,/sdp-offer|type:b\.type/);
assert.match(signal,/ice-candidate|payload:b\.payload/);

assert.match(ecosystem,/universal-voice-bus-v1\.json/);
assert.match(ecosystem,/realtime-voice-execution-contract-v1\.json/);
assert.match(ecosystem,/realtime-voice-multimodal-profile-v1\.json/);
assert.match(ecosystem,/realtime-voice-heavy-use-routing-v1\.json/);

assert.equal(bootstrap.contracts.sensoryEntrypoint,"./sensory-entrypoint.json");
assert.equal(bootstrap.contracts.modelSensory,"./model-sensory-contract-v1.json");
assert.equal(bootstrap.contracts.sensoryFormulaPolicy,"./formula-sensory-policy-v1.json");

assert.equal(q69(0),0);
assert.equal(q69(1),69);
assert.equal(q69(0.5),35);
for(let i=0;i<=1000;i++){
  const rho=i/1000;
  const err=Math.abs(rho-q69(rho)/69);
  assert.ok(err<=1/138+1e-12,"Q69 error bound");
}

const ctrl=new SensoryFormulaController({baseUrl:"http://127.0.0.1:4001"});
for(let i=0;i<16;i++)ctrl.pushRow([0,i/15,0.25,0.5,0.75,1]);
assert.equal(ctrl.historyReady(),true);
assert.equal(ctrl.historyMatrix().length,16);
assert.ok(ctrl.historyMatrix().every(row=>row.length===6));

const frame=(fs,ms)=>fs*(ms/1000);
assert.equal(frame(16000,20),320);
assert.equal(frame(24000,20),480);
assert.equal(frame(48000,20),960);
assert.equal(frame(16000,10),160);
assert.equal(frame(24000,10),240);
assert.equal(frame(48000,10),480);

const pcmBytes=(fs,ms,bits,channels)=>frame(fs,ms)*(bits/8)*channels;
assert.equal(pcmBytes(48000,20,16,1),1920);
assert.equal(pcmBytes(48000,20,16,1)*50,96000);

const coreBytes=65869689+373719040;
assert.equal(coreBytes,439588729);
assert.ok(coreBytes<1024**3);
assert.equal(policy.measuredEvidence.currentPhoneCoreBytes.sum,439588729);

assert.equal(policy.authority.formulaRepo,"4citeB4U/Leeway-formula-live");
assert.match(policy.sourceMath.q69.expression,/Q69/);
assert.equal(policy.q69Mapping.historyShape,"16x6");

console.log("LEEWAY_UNIVERSAL_SENSORY_FORMULA_GATE=PASS");
