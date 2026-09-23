#!/usr/bin/env bash
set -euo pipefail

echo "LeeWay Live portable Bash bootstrap"

detect_host() {
  if [[ -n "${TERMUX_VERSION:-}" || "${PREFIX:-}" == *"com.termux"* ]]; then
    echo "android-termux"; return
  fi
  if grep -qi microsoft /proc/version 2>/dev/null; then
    echo "windows-wsl"; return
  fi
  case "$(uname -s 2>/dev/null || echo unknown)" in
    Linux) echo "linux-bash" ;;
    Darwin) echo "macos-bash" ;;
    *) echo "unknown-bash" ;;
  esac
}

HOST_KIND="$(detect_host)"
ROOT="${LEEWAY_LIVE_ROOT:-$HOME/leeway-live}"
mkdir -p "$ROOT"

echo "host=$HOST_KIND"
echo "root=$ROOT"

if [[ "$HOST_KIND" == "android-termux" ]]; then
  pkg update -y
  pkg install -y python git curl ffmpeg libsndfile
elif command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y python3 python3-venv git curl ffmpeg libsndfile1
fi

PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || command -v python || true)}"
if [[ -z "$PYTHON_BIN" ]]; then
  echo "Python runtime unavailable" >&2
  exit 2
fi

"$PYTHON_BIN" - <<'PY'
import json, platform
print(json.dumps({
  "python": platform.python_version(),
  "system": platform.system(),
  "machine": platform.machine()
}))
PY

echo "Portable Bash bootstrap PASS"
echo "Next: run device-passport and provider qualification before installing/promoting a voice engine."

