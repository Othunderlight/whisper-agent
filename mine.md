## build

pnpm --filter desktop run tauri build -- --bundles rpm
Output: apps/desktop/src-tauri/target/release/bundle/rpm/Voquill-0.1.0-1.x86_64.rpm
Install it with sudo dnf install ./apps/desktop/src-tauri/target/release/bundle/rpm/Voquill-0.1.0-1.x86_64.rpm


## dev
pnpm --filter desktop run dev
That's the dev run (emulator flavor by default). For the dev-services flavor:
VITE_FLAVOR=dev pnpm --filter desktop run dev
Or the packaged dev build:
pnpm --filter desktop run tauri build -- --bundles rpm --config "src-tauri/tauri.dev.conf.json"
