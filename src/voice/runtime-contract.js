/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.RUNTIME.CONTRACT
TAG: CORE.RUNTIME.LEEWAYLIVE.PHONE
COLOR_ONION_HEX:
NEON=#64E9FF
FLUO=#36B7FF
PASTEL=#CDEFFF
ICON_ASCII:
family=lucide
glyph=cpu
5WH:
WHAT = Stable execution contract between LeeWay Live UI, model runtime, skills, tools, and media adapters
WHY = Prevents Pages diagnostics from being confused with native Android execution
WHO = LeeWay Industries / Agent Lee
WHERE = src/voice/runtime-contract.js
WHEN = 2026-09-22
HOW = Defines capability states and acceptance gates without binding to one provider implementation
AGENTS:
ASSESS
AUDIT
AGENT_LEE
VERITAS
LICENSE:
MIT
*/
export const CapabilityState=Object.freeze({ABSENT:"ABSENT",PRESENT:"PRESENT",AUTHORIZED:"AUTHORIZED",EXECUTION_VERIFIED:"EXECUTION_VERIFIED",BLOCKED:"BLOCKED"});
export const PhoneRuntimeContract=Object.freeze({
 model:{primary:"Gemma 3n E2B",state:CapabilityState.PRESENT,runtime:"LiteRT/Google AI Edge",execution:"NATIVE_ANDROID_REQUIRED"},
 voiceInput:{baseline:"push-to-talk",browserDiagnostic:"SpeechRecognition when exposed",native:"AudioRecord"},
 voiceOutput:{baseline:"Android offline TextToSpeech",upgrade:"Sherpa-ONNX",browserDiagnostic:"SpeechSynthesis"},
 vision:{native:"CameraX/Gemma 3n",browserDiagnostic:"getUserMedia"},
 skills:["frontier-voice-architecture-selector","acoustic-coprocessor-fabric","realtime-voice-multimodal-infrastructure"],
 evidenceLaw:"configured != executed; executed != verified"
});