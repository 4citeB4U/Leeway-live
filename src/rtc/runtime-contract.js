/*
REGION: LeeWay Live realtime transport
TAG: LEEWAY-LIVE-RTC-RUNTIME-CONTRACT
WHO: Agent Lee / LeeWay Live clients
WHAT: Canonical browser realtime-session contract for RTC/WebSocket/SFU transports.
WHEN: During live audio/video interaction sessions.
WHERE: 4citeB4U/Leeway-live/src/rtc
WHY: Keep realtime transport separate from Agent Lee identity and Voice Fabric speech authority.
HOW: Normalize session/transport events and forward voice events to the Voice Fabric adapter.
LICENSE: MIT
*/

export const RTC_CONTRACT_VERSION = "1.0.0";

export function createRtcSessionState({
  sessionId,
  transport = "unbound",
  connectionState = "NEW",
  iceState = "UNKNOWN",
  relay = false
} = {}) {
  if (!sessionId) throw new Error("RTC_SESSION_ID_REQUIRED");
  return {
    version: RTC_CONTRACT_VERSION,
    sessionId,
    transport,
    connectionState,
    iceState,
    relay: Boolean(relay),
    voiceAuthority: "4citeB4U/LeeWay-Voice-Fabric",
    deviceAuthority: "4citeB4U/LEEWAY-DEVICE-BRIDGE",
    transportAuthority: "4citeB4U/Leeway-live"
  };
}

export function toVoiceFabricEvent(sessionId, type, payload = {}) {
  if (!sessionId || !type) throw new Error("RTC_EVENT_REQUIRED");
  return {
    type,
    sessionId,
    ...payload,
    source: "leeway-live-rtc",
    targetAuthority: "4citeB4U/LeeWay-Voice-Fabric"
  };
}

export function edgeRtcTransportPromotionMap() {
  return {
    sourceAuthority: "4citeB4U/LeeWay-Edge-RTC",
    targetAuthority: "4citeB4U/Leeway-live",
    promote: [
      "src/rtc/store.ts",
      "src/rtc/mesh-fallback.ts",
      "src/rtc/leeway-rtc-native.ts",
      "services/sfu/src/server.ts"
    ],
    excludeVoiceAuthority: true,
    rule: "Promote transport behavior only after runtime equivalence and security tests."
  };
}
