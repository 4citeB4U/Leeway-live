# Edge RTC transport promotion into LeeWay Live

LeeWay Live is the correct home for the **interaction transport** portion of Edge RTC.

Promote after verification:
- WebRTC session state
- WebSocket signaling
- SFU/mediasoup integration
- ICE/TURN state
- mesh fallback
- browser/mobile realtime client transport

Do not move Agent Lee's voice identity, TTS provider routing, speech queue or canonical persona binding into Live. Those remain behind **LeeWay Voice Fabric**.

The resulting path is:

```text
Agent Lee / Live UI
  -> LeeWay Live RTC transport
  -> transcript/session event
  -> Agent Lee runtime/persona
  -> LeeWay Voice Fabric
  -> selected voicePackageId/provider
  -> RTC/local/device audio transport
```

Edge RTC remains lineage/evidence until equivalence tests permit retirement of duplicated donor code.
