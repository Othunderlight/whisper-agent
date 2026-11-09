# Offline licenses

Licenses are Ed25519-signed JWTs. The app embeds the **public** key and verifies
the token locally, so activation needs no network or account. The app is fully
locked until a valid license is activated.

## Plans

- `normal` unlocks the app.
- `pro` unlocks the app and every Pro feature.

Both are one-time purchases. The tier is part of the signed payload, so it
cannot be changed after issuing.

## One-time setup

```bash
./scripts/license/issue-license.sh init
```

This creates a keypair under `~/.voquill-license` and writes the public key to
`apps/desktop/src-tauri/keys/license-public-key.pub`. Commit that public key and
rebuild the app. The private key stays outside the repository and must never be
committed or shared.

Set `VOQUILL_LICENSE_KEY_DIR` to use a different key location. Running `init`
again is a no-op when the existing private key matches the embedded public key.
Use `init --force` to rotate; existing licenses still verify, but the old private
key can no longer issue licenses that this build accepts.

## Issuing a license

`--tier` is required:

```bash
./scripts/license/issue-license.sh issue --email user@example.com --tier normal
./scripts/license/issue-license.sh issue --email user@example.com --tier pro
./scripts/license/issue-license.sh issue --email user@example.com --tier pro --expires 2027-01-01
```

`--expires` is optional and ends at 23:59:59 local time on that date. Without
it, the license never expires. The token is written to
`~/.voquill-license/licenses/<license-id>.license` and printed to stdout.

The user pastes the token into the activation screen (or Settings → License
after activation). The app verifies the signature, stores the raw token in
SQLite, and re-verifies it on every launch.

## Purchase link

Set `VITE_PURCHASE_URL` at build time to show a "Buy a license" button on the
activation screen and the license dialog:

```bash
VITE_PURCHASE_URL=https://example.com/buy pnpm run dev
```

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
export VOQUILL_TEST_LICENSE="$(./scripts/license/issue-license.sh issue --email test@example.com --tier pro | tail -1)"
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml accepts_generated_token -- --ignored
```
