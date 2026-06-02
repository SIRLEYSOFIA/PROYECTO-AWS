#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-local}"
API_URL="${2:-http://localhost:8080}"
CONFIG_FILE="frontend/src/main/resources/static/config.js"

case "$MODE" in
  local)
    cat > "$CONFIG_FILE" <<'EOF'
window.KIRO_BACKEND_API_BASE_URL = "http://localhost:8080";
window.KIRO_PRODUCTS_API_MODE = "local";
window.KIRO_BACKEND_MODE = "local";
EOF
    ;;
  serverless)
    if [[ "$API_URL" == "http://localhost:8080" ]]; then
      echo "Usage: ./configure-frontend.sh serverless https://TU_API.execute-api.REGION.amazonaws.com" >&2
      exit 1
    fi
    cat > "$CONFIG_FILE" <<EOF
window.KIRO_BACKEND_API_BASE_URL = "$API_URL";
window.KIRO_PRODUCTS_API_MODE = "backend";
window.KIRO_BACKEND_MODE = "serverless";
EOF
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    echo "Use: local | serverless" >&2
    exit 1
    ;;
esac

echo "Updated $CONFIG_FILE for $MODE mode."
