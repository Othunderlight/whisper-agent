# Ryōiki Tenkai CLI

This crate builds three binaries, one per backend environment.

| Binary             | Firebase project                                  | Default `--site`        |
| ------------------ | ------------------------------------------------- | ----------------------- |
| `ryoiki-tenkai`          | `ryoiki-tenkai-prod`                                    | `https://ryoiki-tenkai.com`   |
| `ryoiki-tenkai-dev`      | `ryoiki-tenkai-dev`                                     | `http://localhost:4321` |
| `ryoiki-tenkai-emulator` | `ryoiki-tenkai-dev` + Auth emulator on `127.0.0.1:9099` | `http://localhost:4321` |

Each binary writes its credentials to `~/.config/ryoiki-tenkai/<env>.json` (mode `0600` on Unix). Running one won't overwrite another's session.

## Install

Released builds are published to GitHub Releases and mirrored to Homebrew, APT, and RPM repositories. Pick the channel that matches your OS. Append `--dev` (or `-Dev` on Windows, or swap the package name on package managers) to install the `ryoiki-tenkai-dev` build that targets the dev Firebase backend.

### macOS / Linux (shell installer)

```sh
curl -fsSL https://ryoiki-tenkai.com/install.sh | sh
```

Dev build:

```sh
curl -fsSL https://ryoiki-tenkai.com/install.sh | sh -s -- --dev
```

Pin a specific version:

```sh
curl -fsSL https://ryoiki-tenkai.com/install.sh | sh -s -- --version 1.2.3
```

Installs to `$RYOIKI_TENKAI_INSTALL/bin` (defaults to `~/.ryoiki-tenkai/bin`) and appends it to your shell profile.

### Windows (PowerShell)

```powershell
iwr https://ryoiki-tenkai.com/install.ps1 -UseBasicParsing | iex
```

Dev build:

```powershell
& ([scriptblock]::Create((iwr https://ryoiki-tenkai.com/install.ps1 -UseBasicParsing))) -Dev
```

Pin a specific version:

```powershell
& ([scriptblock]::Create((iwr https://ryoiki-tenkai.com/install.ps1 -UseBasicParsing))) -Version 1.2.3
```

Installs to `%RYOIKI_TENKAI_INSTALL%\bin` (defaults to `%USERPROFILE%\.ryoiki-tenkai\bin`) and adds it to your user `PATH`.

### Homebrew (macOS, Linux)

```sh
brew tap ryoiki-tenkai/ryoiki-tenkai
brew install ryoiki-tenkai
```

Dev build (side-by-side install is fine — the binaries have different names):

```sh
brew install ryoiki-tenkai-dev
```

Upgrade:

```sh
brew update && brew upgrade ryoiki-tenkai
```

### APT (Debian, Ubuntu)

```sh
# Add GPG key
curl -fsSL https://ryoiki-tenkai.github.io/apt/gpg-key.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/ryoiki-tenkai.gpg

# Add repository
echo "deb [signed-by=/usr/share/keyrings/ryoiki-tenkai.gpg] https://ryoiki-tenkai.github.io/apt stable main" \
  | sudo tee /etc/apt/sources.list.d/ryoiki-tenkai.list

sudo apt-get update
sudo apt-get install ryoiki-tenkai
```

For the dev build, swap `stable` for `dev` in the `deb` line and install `ryoiki-tenkai-dev` instead.

Upgrade with `sudo apt-get update && sudo apt-get upgrade ryoiki-tenkai`.

### RPM (Fedora, RHEL, openSUSE)

**Fedora / RHEL:**

```sh
sudo tee /etc/yum.repos.d/ryoiki-tenkai.repo <<'EOF'
[ryoiki-tenkai-stable]
name=Ryōiki Tenkai (stable)
baseurl=https://ryoiki-tenkai.github.io/rpm/packages/stable
enabled=1
gpgcheck=1
gpgkey=https://ryoiki-tenkai.github.io/rpm/gpg-key.asc
EOF

sudo dnf install ryoiki-tenkai
```

**openSUSE:**

```sh
sudo zypper addrepo --gpgcheck https://ryoiki-tenkai.github.io/rpm/packages/stable ryoiki-tenkai-stable
sudo rpm --import https://ryoiki-tenkai.github.io/rpm/gpg-key.asc
sudo zypper install ryoiki-tenkai
```

For the dev build, swap the `stable` path for `dev` (`baseurl=https://ryoiki-tenkai.github.io/rpm/packages/dev`) and install `ryoiki-tenkai-dev` instead.

### Direct download

Every release also posts tarballs, zips, `.deb`, and `.rpm` artifacts at
<https://github.com/ryoiki-tenkai/ryoiki-tenkai/releases>. Prod releases are tagged `cli-v<version>`, dev releases are tagged `cli-dev-v<version>` and marked as pre-release.

### Upgrading from the CLI itself

Once installed, you can re-run the install script through the binary:

```sh
ryoiki-tenkai upgrade
```

This re-executes the appropriate installer for the channel you're on.

## Release channels and publishing

The [`release-cli.yml`](../.github/workflows/release-cli.yml) workflow drives every publish target:

- **Trigger** — every push to `main` that touches `cli/**` cuts a new **dev** release (auto-bumps patch, tagged `cli-dev-v<version>`, marked pre-release). Prod releases are cut via `workflow_dispatch` and promote the most recent (or specified) dev tag to `cli-v<version>`.
- **GitHub Releases** — uploads `ryoiki-tenkai[-dev]-<target>.tar.gz` / `.zip`, plus `.deb` and `.rpm` packages for Linux.
- **Homebrew tap** — regenerates the formula in [`ryoiki-tenkai/homebrew-ryoiki-tenkai`](https://github.com/ryoiki-tenkai/homebrew-ryoiki-tenkai).
- **APT repository** — adds the new `.deb` to [`ryoiki-tenkai/apt`](https://github.com/ryoiki-tenkai/apt) (`stable` codename for prod, `dev` for dev).
- **RPM repository** — adds the new `.rpm` to [`ryoiki-tenkai/rpm`](https://github.com/ryoiki-tenkai/rpm) under `packages/stable` or `packages/dev`.
- **Install scripts** — `apps/web/public/install.sh` and `apps/web/public/install.ps1` are served from `ryoiki-tenkai.com` and resolve the latest matching tag on each channel.

## Build

```sh
cargo build             # all three, debug
cargo build --release
```

Binaries end up in `target/debug/` or `target/release/`.

## Running locally

### Prod

```sh
cargo run --bin ryoiki-tenkai -- login
```

Opens the live authorize page and uses real Firebase.

### Dev

Astro dev server plus the dev Firebase project:

```sh
# terminal 1
cd ../apps/web && pnpm run dev

# terminal 2
cargo run --bin ryoiki-tenkai-dev -- login
```

Hits `http://localhost:4321/authorize?env=dev&...`, which loads the dev Firebase config.

### Emulators

```sh
# terminal 1
firebase emulators:start --only auth --project ryoiki-tenkai-dev

# terminal 2
cd ../apps/web && pnpm run dev

# terminal 3
cargo run --bin ryoiki-tenkai-emulator -- login
```

With `?env=emulator` the authorize page calls `connectAuthEmulator(auth, "http://127.0.0.1:9099")`. The whole sign-in round-trip stays on your machine.

## Pointing at a different frontend

Pass `--site <origin>` to any binary if you want to test against a preview deploy, staging, or some other host. The binary still picks which Firebase project the login goes through.

```sh
ryoiki-tenkai login --site https://preview-42.ryoiki-tenkai.com
ryoiki-tenkai-dev login --site https://staging.ryoiki-tenkai.com
```

The CLI appends `/authorize` itself, so just give it the origin.

## Agent sessions

Wrap an agent command in a Ryōiki Tenkai session:

```sh
ryoiki-tenkai agent [claude|codex|codebuff]
```

Each session gets a random name (e.g. `brave-octopus`) — pass `--slug my-name` to set your own (it's kebab-cased for you). The session is written to the Realtime Database under `session/<uid>/<sessionId>`. The wrapped command runs inside a pty, so interactive TUIs like `claude` work. Exiting the wrapped command deletes the session.

You need to `login` first so the CLI has a token to talk to RTDB. `ryoiki-tenkai-emulator agent` talks to the RTDB emulator on `127.0.0.1:9000` — start it with `firebase emulators:start --only auth,database --project ryoiki-tenkai-dev`.

## One-time Firebase setup

Do this once for `ryoiki-tenkai-prod` and once for `ryoiki-tenkai-dev` in the Firebase Console:

1. Authentication → Sign-in method → enable Google.
2. Authentication → Settings → Authorized domains → add wherever the authorize page is hosted (`ryoiki-tenkai.com` for prod). `localhost` is allowed by default.
