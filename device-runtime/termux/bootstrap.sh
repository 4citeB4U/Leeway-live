#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
echo "LeeWay Live Termux device HTTP bootstrap"
pkg update -y
pkg install -y python git curl ffmpeg libsndfile
echo "[1/4] Base runtime installed"
if pkg search python-torch 2>/dev/null | grep -q python-torch; then
  echo "[2/4] Termux python-torch package is available; install is optional until Device Passport qualifies XTTS."
else
  echo "[2/4] python-torch package not visible in this repository mirror; XTTS stays BLOCKED_PENDING_PROVIDER."
fi
python - <<'PY'
import platform,json
print(json.dumps({"platform":platform.platform(),"machine":platform.machine(),"python":platform.python_version()}))
PY
echo "[3/4] Create ~/leeway-live and place device-runtime/http/server.py there."
echo "[4/4] Start with: LEEWAY_HTTP_HOST=127.0.0.1 LEEWAY_HTTP_PORT=8788 python ~/leeway-live/server.py"
echo "XTTS is NOT promoted by this bootstrap. Run the provider qualification gate first."

