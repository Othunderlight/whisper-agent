#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

KEY_DIR="${RYOIKI_TENKAI_LICENSE_KEY_DIR:-$HOME/.ryoiki-tenkai-license}"
PRIVATE_KEY="$KEY_DIR/private.pem"
PUBLIC_KEY="$KEY_DIR/public.pem"
EMBEDDED_PUBLIC_KEY="$ROOT_DIR/apps/desktop/src-tauri/keys/license-public-key.pub"
OUTPUT_DIR="${RYOIKI_TENKAI_LICENSE_OUTPUT_DIR:-$KEY_DIR/licenses}"

PRODUCT="ryoiki-tenkai"
SUPPORTED_TIERS="normal pro"
SUPPORTED_PROVIDERS="groq"
DEFAULT_GROQ_MODEL="whisper-large-v3"

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
      $RYOIKI_TENKAI_LICENSE_KEY_DIR (default: ~/.ryoiki-tenkai-license), and the public
      key is written into the app source. Rebuild the app afterwards.

  issue-license.sh issue --email <email> --tier <normal|pro> [--expires <date|never>] [--out <dir>]
      Sign a license key for a customer. Writes <license-id>.license and
      prints the key to stdout.

      Pro licenses also require a provider preset:
        --provider <groq>        Only groq is supported for now.
        --api-key <key>          The provider API key (or set RYOIKI_TENKAI_LICENSE_API_KEY).
        --model <model>          Defaults to whisper-large-v3.

  issue-license.sh show-key
      Print the public key currently embedded in the app.

Environment:
  RYOIKI_TENKAI_LICENSE_KEY_DIR       Where the private/public keypair lives.
  RYOIKI_TENKAI_LICENSE_OUTPUT_DIR    Where issued license files are written.

Examples:
  ./scripts/license/issue-license.sh init
  ./scripts/license/issue-license.sh issue --email user@example.com --tier normal
  ./scripts/license/issue-license.sh issue --email user@example.com --tier pro \
    --provider groq --api-key "gsk_..." --expires 2027-01-01
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
    local existing_public
    existing_public="$(openssl pkey -in "$PRIVATE_KEY" -pubout 2>/dev/null || true)"
    if [[ -n "$existing_public" && -f "$EMBEDDED_PUBLIC_KEY" ]] &&
      [[ "$existing_public" == "$(cat "$EMBEDDED_PUBLIC_KEY")" ]]; then
      note "Keys are already initialized."
      note "Private key:  $PRIVATE_KEY"
      note "Embedded key: $EMBEDDED_PUBLIC_KEY"
      return 0
    fi

    die "a private key already exists at $PRIVATE_KEY (use --force to replace it)"
  fi

  if [[ ! -f "$PRIVATE_KEY" && "$force" != true ]] &&
    [[ -f "$EMBEDDED_PUBLIC_KEY" ]] &&
    ! grep -q "REPLACE_ME" "$EMBEDDED_PUBLIC_KEY"; then
    die "the app already embeds a public key but no private key was found at $PRIVATE_KEY; generating a new keypair would invalidate existing licenses (use --force to rotate)"
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
  local tier=""
  local provider=""
  local api_key=""
  local model=""
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
      --provider|-p)
        [[ $# -ge 2 ]] || die "--provider requires a value"
        provider="$2"
        shift
        ;;
      --api-key|-k)
        [[ $# -ge 2 ]] || die "--api-key requires a value"
        api_key="$2"
        shift
        ;;
      --model|-m)
        [[ $# -ge 2 ]] || die "--model requires a value"
        model="$2"
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
  [[ -n "$tier" ]] || die "--tier is required (normal or pro)"
  case " $SUPPORTED_TIERS " in
    *" $tier "*) ;;
    *) die "unsupported tier: $tier (the app currently accepts: $SUPPORTED_TIERS)" ;;
  esac
  [[ -f "$PRIVATE_KEY" ]] ||
    die "no private key at $PRIVATE_KEY (run: $0 init)"

  if [[ "$tier" == "pro" ]]; then
    [[ -n "$provider" ]] || die "--provider is required for pro licenses"
    case " $SUPPORTED_PROVIDERS " in
      *" $provider "*) ;;
      *) die "unsupported provider: $provider (the app accepts: $SUPPORTED_PROVIDERS)" ;;
    esac

    [[ -n "$api_key" ]] || api_key="${RYOIKI_TENKAI_LICENSE_API_KEY:-}"
    [[ -n "$api_key" ]] ||
      die "--api-key is required for pro licenses (or set RYOIKI_TENKAI_LICENSE_API_KEY)"
    model="${model:-$DEFAULT_GROQ_MODEL}"
  else
    [[ -z "$provider" && -z "$api_key" && -z "$model" ]] ||
      die "provider options (--provider, --api-key, --model) are only valid for pro licenses"
  fi

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

  local provider_json="null"
  if [[ "$tier" == "pro" ]]; then
    provider_json="$(jq -cn \
      --arg provider "$provider" \
      --arg apiKey "$api_key" \
      --arg model "$model" \
      '{provider: $provider, apiKey: $apiKey, model: $model}')"
  fi

  local payload
  payload="$(jq -cn \
    --argjson v 1 \
    --arg product "$PRODUCT" \
    --arg id "$license_id" \
    --arg email "$email" \
    --arg tier "$tier" \
    --argjson iat "$issued_at" \
    --argjson expires "$expires_json" \
    --argjson provider "$provider_json" \
    '{v: $v, product: $product, id: $id, email: $email, tier: $tier, iat: $iat, expires: $expires, provider: $provider}')"

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
  if [[ "$tier" == "pro" ]]; then
    note "Provider: $provider"
    note "Model:    $model"
  fi
  if [[ "$expires" == "never" ]]; then
    note "Expires:  never"
  else
    note "Expires:  $expires (end of day, local time)"
  fi
  note "File:     $license_path"
  if [[ "$tier" == "pro" ]]; then
    note ""
    note "This license embeds the provider API key. Treat it as a secret."
  fi
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
