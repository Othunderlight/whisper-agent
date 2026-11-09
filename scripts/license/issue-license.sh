#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

KEY_DIR="${VOQUILL_LICENSE_KEY_DIR:-$HOME/.voquill-license}"
PRIVATE_KEY="$KEY_DIR/private.pem"
PUBLIC_KEY="$KEY_DIR/public.pem"
EMBEDDED_PUBLIC_KEY="$ROOT_DIR/apps/desktop/src-tauri/keys/license-public-key.pub"
OUTPUT_DIR="${VOQUILL_LICENSE_OUTPUT_DIR:-$KEY_DIR/licenses}"

PRODUCT="voquill"
DEFAULT_TIER="pro"

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

note() {
  printf '%s\n' "$*"
}

require() {
  command -v "$1" >/dev/null 2>&1 || die "missing dependency: $1"
}

b64url() {
  openssl base64 -A | tr '+/' '-_' | tr -d '='
}

usage() {
  cat <<'EOF'
Usage:
  issue-license.sh init [--force]
      Generate an Ed25519 keypair. The private key stays in
      $VOQUILL_LICENSE_KEY_DIR (default: ~/.voquill-license), and the public
      key is written into the app source. Rebuild the app afterwards.

  issue-license.sh issue --email <email> [--tier pro] [--expires <date|never>] [--out <dir>]
      Sign a license key for a customer. Writes <license-id>.license and
      prints the key to stdout.

  issue-license.sh show-key
      Print the public key currently embedded in the app.

Environment:
  VOQUILL_LICENSE_KEY_DIR       Where the private/public keypair lives.
  VOQUILL_LICENSE_OUTPUT_DIR    Where issued license files are written.

Examples:
  ./scripts/license/issue-license.sh init
  ./scripts/license/issue-license.sh issue --email user@example.com
  ./scripts/license/issue-license.sh issue --email user@example.com --expires 2027-01-01
EOF
}

cmd_init() {
  local force=false

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --force) force=true ;;
      -h|--help) usage; return 0 ;;
      *) die "unknown option: $1" ;;
    esac
    shift
  done

  require openssl

  if [[ -f "$PRIVATE_KEY" && "$force" != true ]]; then
    die "a private key already exists at $PRIVATE_KEY (use --force to replace it)"
  fi

  mkdir -p "$KEY_DIR"
  chmod 700 "$KEY_DIR"

  umask 077
  openssl genpkey -algorithm ED25519 -out "$PRIVATE_KEY"
  chmod 600 "$PRIVATE_KEY"

  openssl pkey -in "$PRIVATE_KEY" -pubout -out "$PUBLIC_KEY"

  mkdir -p "$(dirname "$EMBEDDED_PUBLIC_KEY")"
  cp "$PUBLIC_KEY" "$EMBEDDED_PUBLIC_KEY"
  chmod 644 "$EMBEDDED_PUBLIC_KEY"

  note "Private key: $PRIVATE_KEY"
  note "Public key:  $PUBLIC_KEY"
  note "Embedded key: $EMBEDDED_PUBLIC_KEY"
  note ""
  note "Commit the embedded public key, then rebuild the app."
  note "Never commit or share the private key."
}

cmd_issue() {
  local email=""
  local tier="$DEFAULT_TIER"
  local expires="never"
  local out_dir="$OUTPUT_DIR"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --email|-e)
        [[ $# -ge 2 ]] || die "--email requires a value"
        email="$2"
        shift
        ;;
      --tier|-t)
        [[ $# -ge 2 ]] || die "--tier requires a value"
        tier="$2"
        shift
        ;;
      --expires|-x)
        [[ $# -ge 2 ]] || die "--expires requires a value"
        expires="$2"
        shift
        ;;
      --out|-o)
        [[ $# -ge 2 ]] || die "--out requires a value"
        out_dir="$2"
        shift
        ;;
      -h|--help)
        usage
        return 0
        ;;
      *)
        die "unknown option: $1"
        ;;
    esac
    shift
  done

  require openssl
  require jq

  [[ -n "$email" ]] || die "--email is required"
  [[ "$email" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]] ||
    die "invalid email: $email"
  [[ "$tier" == "$DEFAULT_TIER" ]] ||
    die "unsupported tier: $tier (the app currently accepts: $DEFAULT_TIER)"
  [[ -f "$PRIVATE_KEY" ]] ||
    die "no private key at $PRIVATE_KEY (run: $0 init)"

  local issued_at expires_json
  issued_at="$(date +%s)"

  if [[ "$expires" == "never" ]]; then
    expires_json="null"
  else
    expires_json="$(date -d "$expires 23:59:59" +%s 2>/dev/null)" ||
      die "invalid expiry date: $expires (use YYYY-MM-DD or 'never')"
  fi

  local license_id
  license_id="lic_$(date -u +%Y%m%d)_$(openssl rand -hex 4)"

  local payload
  payload="$(jq -cn \
    --argjson v 1 \
    --arg product "$PRODUCT" \
    --arg id "$license_id" \
    --arg email "$email" \
    --arg tier "$tier" \
    --argjson iat "$issued_at" \
    --argjson expires "$expires_json" \
    '{v: $v, product: $product, id: $id, email: $email, tier: $tier, iat: $iat, expires: $expires}')"

  local header='{"alg":"EdDSA","typ":"JWT"}'
  local header_b64 payload_b64 signing_input
  header_b64="$(printf '%s' "$header" | b64url)"
  payload_b64="$(printf '%s' "$payload" | b64url)"
  signing_input="$header_b64.$payload_b64"

  local tmp_dir
  tmp_dir="$(mktemp -d)"
  CLEANUP_DIR="$tmp_dir"
  trap 'rm -rf "${CLEANUP_DIR:-}"' EXIT

  printf '%s' "$signing_input" >"$tmp_dir/signing-input.txt"
  openssl pkeyutl -sign \
    -inkey "$PRIVATE_KEY" \
    -rawin \
    -in "$tmp_dir/signing-input.txt" \
    -out "$tmp_dir/signature.bin"

  openssl pkeyutl -verify \
    -pubin \
    -inkey "$PUBLIC_KEY" \
    -rawin \
    -in "$tmp_dir/signing-input.txt" \
    -sigfile "$tmp_dir/signature.bin" >/dev/null

  local signature_b64 token
  signature_b64="$(b64url <"$tmp_dir/signature.bin")"
  token="$signing_input.$signature_b64"

  local embedded
  embedded="$(cat "$EMBEDDED_PUBLIC_KEY" 2>/dev/null || true)"
  local derived
  derived="$(openssl pkey -in "$PRIVATE_KEY" -pubout)"

  if [[ -n "$embedded" && "$embedded" != "$derived" ]]; then
    note "warning: the embedded public key does not match this private key."
    note "         run '$0 init --force', rebuild the app, then issue again."
    note ""
  fi

  mkdir -p "$out_dir"
  local license_path="$out_dir/$license_id.license"
  printf '%s\n' "$token" >"$license_path"
  chmod 644 "$license_path"

  note "License:  $license_id"
  note "Email:    $email"
  note "Tier:     $tier"
  if [[ "$expires" == "never" ]]; then
    note "Expires:  never"
  else
    note "Expires:  $expires (end of day, local time)"
  fi
  note "File:     $license_path"
  note ""
  note "$token"
}

cmd_show_key() {
  if [[ ! -f "$EMBEDDED_PUBLIC_KEY" ]]; then
    die "no embedded public key at $EMBEDDED_PUBLIC_KEY"
  fi

  note "$EMBEDDED_PUBLIC_KEY"
  cat "$EMBEDDED_PUBLIC_KEY"
}

main() {
  local command="${1:-}"
  if [[ $# -gt 0 ]]; then
    shift
  fi

  case "$command" in
    init) cmd_init "$@" ;;
    issue) cmd_issue "$@" ;;
    show-key) cmd_show_key "$@" ;;
    ""|-h|--help|help) usage ;;
    *) die "unknown command: $command (run with --help)" ;;
  esac
}

main "$@"
