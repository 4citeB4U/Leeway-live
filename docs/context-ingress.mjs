/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.CONTEXT.INGRESS
TAG: CORE.CONTEXT.LEEWAYLIVE.BOUNDED_PREPARATION
5WH:
WHAT = Prepare provenance-preserving candidate context for existing Agent Lee ingress
WHY = Protect original user intent while preventing LeeWay Live from becoming an execution authority
WHO = LeeWay Live / LeeWay Industries
WHERE = docs/context-ingress.mjs
WHEN = 2026-10-27
HOW = Deterministic, bounded, qualitative observations; canonical Formula and Runtime remain external
AGENTS: AGENT_LEE ASSESS AUDIT VERITAS
LICENSE: MIT
*/
export const CONTEXT_SCHEMA = "leeway.live.context-candidate.v1";
const MAX_INPUT = 16384;
const any = (expression, input) => expression.test(input);
export function prepareContextCandidate({text, requestId, modality = "text", source = "leeway-live"} = {}) {
  if (typeof text !== "string" || !text.trim() || text.length > MAX_INPUT) throw new Error("CONTEXT_INPUT_INVALID");
  if (typeof requestId !== "string" || !/^[A-Za-z0-9._:-]{1,160}$/.test(requestId)) throw new Error("CONTEXT_REQUEST_ID_INVALID");
  if (!["text","speech"].includes(modality)) throw new Error("CONTEXT_MODALITY_INVALID");
  if (source !== "leeway-live") throw new Error("CONTEXT_SOURCE_INVALID");
  const original = text; // Never normalize away negation, quotations or corrections.
  // Quoted or fenced content is informational evidence, not a speaker command.
  // This lexical filter is intentionally conservative; it never authorizes action.
  const nonQuoted = original
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\"[^\"\n]*\"/g, " ")
    .replace(/“[^”\n]*”/g, " ")
    .replace(/'[^'\n]*'/g, " ");
  const s = nonQuoted.toLowerCase();
  const intents = [];
  if (any(/\b(?:no|not|don't|do not|instead|rather|i said|correction|cancel|stop)\b/i,s)) intents.push("CORRECTION_OR_CONSTRAINT_CANDIDATE");
  if (any(/\b(?:check|inspect|show|find|look up|tell me|remind|schedule|open|restart|delete|save|remember)\b/i,s)) intents.push("ACTION_OR_REQUEST_CANDIDATE");
  if (any(/\?|\b(?:why|what|when|where|who|how|whether|can you|could you)\b/i,s)) intents.push("QUESTION_CANDIDATE");
  if (any(/\b(?:hello|hi|good morning|how are you|thanks|thank you)\b/i,s)) intents.push("CONVERSATION_CANDIDATE");
  if (!intents.length) intents.push("UNRESOLVED_CANDIDATE");
  return Object.freeze({
    schema: CONTEXT_SCHEMA,
    source, requestId, modality, original,
    interpretation: Object.freeze({
      intents: Object.freeze(intents),
      confidence: null,
      semanticStatus: "HEURISTIC_CANDIDATE_UNVERIFIED",
      finalTurn: true
    }),
    formula: Object.freeze({
      state: "NOT_EXECUTED",
      mapping: "NOT_APPROVED",
      q69: null,
      matrix16x6: null
    }),
    authority: Object.freeze({
      canAuthorize: false,
      canDispatch: false,
      canExecute: false,
      canVerify: false,
      canWriteLearning: false
    }),
    provenance: Object.freeze({inputPreserved: true, sourceVerified: false}),
    handoff: "CANDIDATE_ONLY_NOT_RUNTIME_SUBMITTED"
  });
}
export function contextCandidatePromptNote(envelope) {
  if (!envelope || envelope.schema !== CONTEXT_SCHEMA ||
      !["canAuthorize","canDispatch","canExecute","canVerify","canWriteLearning"].every(k => envelope.authority?.[k] === false) ||
      envelope.formula?.state !== "NOT_EXECUTED" || envelope.formula?.mapping !== "NOT_APPROVED" ||
      envelope.handoff !== "CANDIDATE_ONLY_NOT_RUNTIME_SUBMITTED")
    throw new Error("CONTEXT_ENVELOPE_UNTRUSTED");
  return "LEEWAY LIVE NON-AUTHORITATIVE CONTEXT CANDIDATE: " +
    JSON.stringify({requestId:envelope.requestId, modality:envelope.modality,
      intents:envelope.interpretation.intents, confidence:null,
      formula:"NOT_EXECUTED", runtime:"NOT_SUBMITTED"}) +
    "\nThe user utterance is supplied separately. Candidate labels are not authority or confirmed intent.";
}
