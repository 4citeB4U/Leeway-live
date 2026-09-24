import fs from "node:fs";
import assert from "node:assert/strict";

const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const app=read("docs/app.js");
const model=read("docs/model-runtime.js");
const ecosystem=read("docs/ecosystem.js");
const html=read("docs/index.html");

assert.match(app,/model\.generate\(/,"text turns must invoke a real model adapter");
assert.match(app,/model\.see\(/,"vision turns must invoke a vision model adapter");
assert.doesNotMatch(app,/I heard you\. The LeeWay Live interface is connected/,"canned G0 response must not return");
assert.match(model,/@huggingface\/transformers@4\.3\.0/,"browser inference runtime must be pinned");
assert.match(model,/Qwen2\.5-0\.5B-Instruct/,"text model profile must be explicit");
assert.match(model,/SmolVLM-256M-Instruct/,"vision model profile must be explicit");
assert.match(ecosystem,/LeeWay-Agent-Skills\/main\/config\/leeway-capability-manifold\.yaml/,"capability manifold must bind canonically");
assert.match(ecosystem,/Leeway-formula-live\/main\/contracts\/consumer-contract\.json/,"Formula consumer contract must bind canonically");
assert.doesNotMatch(ecosystem,/\/evaluate["'\x60]/,"browser binding must not directly claim or fire Formula evaluation");
assert.match(ecosystem,/FORMULA_DISCOVERY/,"Formula discovery must emit evidence");
assert.match(html,/id="seeButton"/,"vision control must exist");
assert.match(html,/id="runtimeStatus"/,"runtime state must be visible");
console.log("LEEWAY_LIVE_SOURCE_GATE=PASS");
