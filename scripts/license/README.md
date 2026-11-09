# Offline licenses

Licenses are Ed25519-signed JWTs. The app embeds the **public** key and verifies
the token locally, so activation needs no network or account.

## One-time setup

```bash
./scripts/license/issue-license.sh init
```

This creates a keypair under `~/.voquill-license` and writes the public key to
`apps/desktop/src-tauri/keys/license-public-key.pub`. Commit that public key and
rebuild the app. The private key stays outside the repository and must never be
committed or shared.

Set `VOQUILL_LICENSE_KEY_DIR` to use a different key location.

## Issuing a license

```bash
./scripts/license/issue-license.sh issue --email user@example.com
./scripts/license/issue-license.sh issue --email user@example.com --expires 2027-01-01
```

`--expires` is optional and ends at 23:59:59 local time on that date. Without
it, the license never expires. The token is written to
`~/.voquill-license/licenses/<license-id>.license` and printed to stdout.

The user pastes the token into **Settings → License → Activate license**. The app
verifies the signature, stores the raw token in SQLite, and re-verifies it on
every launch.

## Design notes

- The payload contains `v`, `product`, `id`, `email`, `tier`, `iat`, and
  `expires`. `product` is `voquill`; the app rejects tokens for other products.
- The token is not secret. It is a public, signed statement, safe to email or
  put in a QR code.
- Offline licenses can be shared. Machine binding and revocation would require
  extra fields and an online check; this setup intentionally does neither.
- Expiry uses the local system clock, so a user can bypass it by changing the
  clock. Acceptable for a small personal project.
- If the private key is lost, existing licenses still verify, but no new ones
  can be issued for the embedded public key. Re-keying requires shipping an app
  update with the new public key.

## Requirements

- OpenSSL 3.x (Ed25519 signing with `-rawin`)
- `jq`
- GNU `date` for `--expires`

## Verifying the generator end to end

```bash
export VOQUILL_TEST_LICENSE="$(./scripts/license/issue-license.sh issue --email test@example.com | tail -1)"
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml accepts_generated_token -- --ignored
```
