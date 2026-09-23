#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
BASE="${LEEWAY_HTTP_BASE:-http://127.0.0.1:8788}"
echo "== LeeWay Live device HTTP qualification =="
curl -fsS "$BASE/health"; echo
curl -fsS "$BASE/v1/device/passport"; echo
curl -fsS "$BASE/v1/runtime/status"; echo
curl -fsS "$BASE/v1/voice/profiles"; echo
curl -fsS "$BASE/v1/vision/status"; echo
echo "HTTP control-plane checks passed."
echo "Voice byte-stream, cancellation, and vision-image tests require provider-specific fixtures and are separate Veritas gates."

