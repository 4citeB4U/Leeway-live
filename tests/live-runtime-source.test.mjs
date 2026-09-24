import fs from "node:fs";
import assert from "node:assert/strict";

const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const app=read("docs/app.js");
const model=read("docs/model-runtime.js");
const ecosystem=read("docs/ecosystem.js");
const html=read("docs/index.html");
const bootstrap=JSON.parse(read("docs/bootstrap.json"));

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


import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const relay=read("docs/phone-relay.js");
const app=read("docs/app.js");
const media=read("docs/media.js");
const html=read("docs/index.html");

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
assert.match(app,/media\.speak/);

assert.match(media,/SpeechRecognition\|\|window\.webkitSpeechRecognition/);
assert.match(media,/speechSynthesis/);
assert.match(html,/id="phoneDeviceId"/);
assert.match(html,/id="phonePairingToken"/);
assert.match(html,/id="connectPhone"/);
assert.match(html,/id="phoneStatus"/);

console.log("LEEWAY_STAGE1_DEVICE_AGNOSTIC_VOICE_GATE=PASS");
