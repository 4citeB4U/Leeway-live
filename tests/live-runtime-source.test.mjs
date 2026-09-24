import fs from "node:fs";
import assert from "node:assert/strict";

const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const app=read("docs/app.js");
const model=read("docs/model-runtime.js");
const ecosystem=read("docs/ecosystem.js");
const html=read("docs/index.html");
const bootstrap=JSON.parse(read("docs/bootstrap.json"));

assert.match(app,/configureInstaller\(/,"Pages must configure the phone installer");
assert.match(app,/ANDROID_PACKAGE_DISCOVERED|androidPackage/,"Pages must consume discovered package state");
assert.match(app,/model\.generate\(/,"browser diagnostic text turns must invoke a real model adapter");
assert.match(app,/model\.see\(/,"browser diagnostic vision turns must invoke a real model adapter");
assert.doesNotMatch(app,/I heard you\. The LeeWay Live interface is connected/,"canned G0 response must not return");

assert.match(model,/@huggingface\/transformers@4\.3\.0/,"browser diagnostic runtime must be pinned");
assert.match(ecosystem,/LEEWAY-DEVICE-BRIDGE\/main\/docs\/package-manifest\.json/,"installer must bind canonical Device Bridge package manifest");
assert.match(ecosystem,/LeeWay-Agent-Skills\/main\/config\/leeway-capability-manifold\.yaml/,"capability manifold must bind canonically");
assert.match(ecosystem,/Leeway-formula-live\/main\/contracts\/consumer-contract\.json/,"Formula consumer contract must bind canonically");
assert.doesNotMatch(ecosystem,/\/evaluate["'`]/,"Pages binding must not directly claim or fire Formula evaluation");

assert.match(html,/id="installButton"/,"phone package download control must exist");
assert.match(html,/id="packageInfo"/,"package evidence must be visible");
assert.match(html,/id="runtimeStatus"/,"runtime state must be visible");

assert.equal(bootstrap.executionAuthority,"PHONE_LOCAL_NATIVE_PACKAGE");
assert.equal(bootstrap.repositories.deviceBridge,"https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE");
assert.equal(bootstrap.repositories.agentSkills,"https://github.com/4citeB4U/LeeWay-Agent-Skills");
assert.equal(bootstrap.repositories.formula,"https://github.com/4citeB4U/Leeway-formula-live");

console.log("LEEWAY_LIVE_GITHUB_FIRST_SOURCE_GATE=PASS");
