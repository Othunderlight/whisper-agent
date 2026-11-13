#!/bin/sh
set -e

ENV_FILE="$1"

cat > "$ENV_FILE" << EOF
window.__RYOIKI_TENKAI__ = {
  RYOIKI_TENKAI_GATEWAY_URL: "${RYOIKI_TENKAI_GATEWAY_URL:-}",
  RYOIKI_TENKAI_APP_NAME: "${RYOIKI_TENKAI_APP_NAME:-}",
};
EOF

shift
exec "$@"
