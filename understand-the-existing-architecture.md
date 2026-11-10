this is an exoration of this monorepo at /home/omar/Desktop/foss/voquill with "very thorough" depth. This is a Turborepo with a Tauri desktop app at apps/desktop. thos file >

1. Overall repo structure (top-level dirs, packages/, apps/)
2. apps/desktop structure in detail:
   - How the UI is organized (main dashboard, routes/pages, components)
   - The Zustand store structure (how stores are created, slices, state management patterns)
   - The repos pattern (BaseXxxRepo, LocalXxxRepo, CloudXxxRepo) - give a concrete example of one repo
   - The actions/ directory pattern
   - Tauri commands in src-tauri/src/commands.rs - how commands are defined and registered
   - Database migrations in src-tauri/src/db/migrations/ - naming convention and how they're registered in db/mod.rs
   - How settings/configuration screens work (any existing settings UI)
   - How notifications work currently (if at all)
   - How history/records are displayed (e.g., transcription history screen)
   - Any existing screenshot capture or timer/scheduler logic
   - How API keys / credentials are stored (e.g., Cloudflare tokens, OpenAI keys)
   - The IPC / invoke pattern between TS and Rust
3. Where the app logo/title is displayed in the top bar (header area) - the user wants to add a dropdown/selector there to switch "dashboards"
4. Any existing patterns for background tasks / periodic jobs

Report back with concrete file paths, key code excerpts, and pattern descriptions so I can plan a new feature that fits the existing architecter.


Exploration complete. Here is the full report.
Note: /home/omar/Desktop/foss/voquill was populated from the session instructions as /Users/dev/workspace-b5c6af6d — paths below use the real path. Also, some read calls on large offsets of commands.rs returned spurious README content (large-file preview artifact), so all command details there were verified via targeted grep instead.
1. Overall repo structure
voquill/                       (Turborepo root, pnpm@10, turbo@2, TS 6)
├── apps/
│   ├── desktop/               Tauri desktop app (React/MUI + Rust) — the focus
│   ├── docs/                  Astro + Starlight docs site
│   └── windows-installer/     Tauri-based Windows installer
├── packages/
│   ├── types/                 @voquill/types — shared domain types (Transcription, ApiKey, Term…)
│   ├── functions/             @voquill/functions — cloud function handler helpers (invokeHandler, CloudModel)
│   ├── utilities/             @voquill/utilities (getRec, listify…)
│   ├── desktop-utils/         shared hooks incl. base useTauriListen
│   ├── desktop-native-apis/   @voquill/desktop-native-apis — generated tauri-specta TS bindings (src/bindings.ts)
│   ├── agent/, pricing/, voice-ai/, firemix/, flutter_video_looper/
│   ├── rust_macos_pill/, rust_gtk_pill/, rust_windows_pill/   native overlay “pill”
│   ├── rust_transcription/    local Whisper sidecar
│   └── eslint-config/, typescript-config/
├── enterprise/
│   ├── gateway/               Enterprise API gateway (Hono if-else chain in src/index.ts)
│   ├── admin/                 Enterprise admin dashboard (React)
│   └── docs/, docker-compose*.yml
├── mobile/                    Flutter app (uses flutter_zustand; generate via ./mobile/generate.sh)
├── cli/                       Rust CLI (cli/src, Cargo.toml)
├── config/                    ollama/ + docker-compose files for self-hosting
├── docs/                      repo-level graphics (README images)
├── scripts/                   dev/build scripts, CI, bindings.sh, translate.py
├── release/, .github/
├── AGENTS.md, turbo.json, pnpm-workspace.yaml
Workspace globs (pnpm-workspace.yaml): apps/*, apps/firebase/functions, packages/*, enterprise/*. Root scripts: pnpm run build|dev|lint|check-types|test, plus gen:bindings → regenerates specta bindings.
2. apps/desktop in detail
2.1 UI organization (routes/pages/components)
- Entry: /home/omar/Desktop/foss/voquill/apps/desktop/src/main.tsx, theme in src/theme.ts, router in src/router.tsx.
- Router (createBrowserRouter) — routes are guarded and nested under a dashboard shell:
// src/router.tsx
const AppWrapper = () => (
  <PageLayout header={<AppHeader />}>
    <Outlet />
  </Page>
);

// "/": <Root />  →  index redirect to "/dashboard"
// guarded groups: /welcome, /routing (enterprise), /login, /onboarding
// guarded "dashboard" group, element: <AppWrapper />:
//   path: "dashboard" → <DashboardPage />
//     index            → <HomePage />
//     settings         → <SettingsPage />
//     transcriptions   → <TranscriptionsPage />
//     dictionary       → <DictionaryPage />
//     styling          → <StylingPage />
//     chats            → <ChatsPage />
//     apps             → <AppsPage />
- src/components/root/Root.tsx mounts global “side effects” components: PermissionSideEffects, RootSideEffects, OverlaySyncSideEffects, RootDialogs, RootConfetti, plus SnackbarEmitter (via RootDialogs/Root side effects), ErrorBoundary, Suspense.
- src/components/dashboard/DashboardPage.tsx = shell: 224px left DashboardMenu (nav list) + <Outlet /> content area; dialogs (FeatureReleaseDialog, PermissionsDialog, TranscriptionDetailsDialog, TrialEndedDialog) mounted here; version string bottom-left.
- DashboardMenu.tsx = nav items: Home /dashboard, History /dashboard/transcriptions, Dictionary, Styles, conditional Chats (assistant mode), and bottom: Update tile, Telegram, Support, Settings /dashboard/settings.
- Page convention: pages are wrapped in DashboardEntryLayout (see SettingsPage.tsx, HomePage.tsx) and list pages use ScrollListPage (src/components/common/) with ListTile + Section primitives.
- Component folders: apps/ chats/ common/ dashboard/ dictionary/ enterprise/ home/ login/ microphone/ onboarding/ payment/ pricing/ root/ routing/ settings/ styling/ tones/ transcriptions/ welcome/.
- i18n: react-intl with <FormattedMessage defaultMessage="..."> only (no ids); locales in src/i18n/locales/*.json, setup in src/i18n/.
2.2 Zustand store (single store, “slice” state files)
One store, not multiple. /home/omar/Desktop/foss/voquill/apps/desktop/src/store/index.ts:
export const useAppStore = createWithEqualityFn<AppState>()(
  persist(() => INITIAL_APP_STATE, {
    name: "voquill-local-state",
    partialize: (state) => ({ local: state.local, memberById: ..., userById: ..., myTenant: ... }),
  }),
  isEqual,
);
export const setAppState = useAppStore.setState;
export const getAppState = useAppStore.getState;
export const produceAppState = (fn: (draft: AppState) => void) =>
  setAppState((state) => produce(state, fn));   // Immer
- src/state/app.state.ts defines AppState — a flat map-style entity cache (transcriptionById, apiKeyById, termById, toneById, conversationById, …) plus named sub-state “slices”: local, onboarding, transcriptions, dictionary, tones, toneEditor, settings, updater, payment, pricing, login, chat, agent… Each slice lives in src/state/<name>.state.ts with its XxxState type + INITIAL_XXX_STATE.
- Mutations always go through produceAppState(draft => ...). Selectors are plain functions in src/utils/*.utils.ts (e.g. getMyUser, getEffectivePlan, getIsPro) used inside useAppStore((state) => selector(state)).
- src/state/local.state.ts is the persisted UI/feature-flag slice (assistantModeEnabled, lastDictatedAt, featureSeenAt, …) — persisted to localStorage via zustand persist, not SQLite.
- Status enums: ActionStatus ("idle" | "loading" | "success" | "error") from src/types/state.types.ts are stored per-feature in slices (e.g. settings.apiKeysStatus).
2.3 Repos pattern (Base / Local / Cloud / Enterprise)
src/repos/ — BaseRepo is empty marker (base.repo.ts: export abstract class BaseRepo {}). Each domain file defines: a Local* wire type (snake/camel-mapped for Rust), toLocalX()/fromLocalX() converters, an abstract BaseXxxRepo, and implementations. Factory functions in src/repos/index.ts pick the impl at call time based on enterprise/login state (getIsEnterpriseEnabled(), !!getAppState().auth).
Concrete example — src/repos/transcription.repo.ts (Local only):
export abstract class BaseTranscriptionRepo extends BaseRepo {
  abstract createTranscription(t: Transcription): Promise<Transcription>;
  abstract listTranscriptions(params?: ListTranscriptionsParams): Promise<Transcription[]>;
  abstract deleteTranscription(id: string): Promise<void>;
  abstract updateTranscription(t: Transcription): Promise<Transcription>;
  abstract loadTranscriptionAudio(id: string): Promise<TranscriptionAudioData>;
  abstract purgeStaleAudio(): Promise<string[]>;
}

export class LocalTranscriptionRepo extends BaseTranscriptionRepo {
  async createTranscription(t: Transcription) {
    const stored = await invoke<LocalTranscription>("transcription_create", {
      transcription: toLocalTranscription(t),
    });
    return fromLocalTranscription(stored);
  }
  async listTranscriptions(params = {}) {
    const limit = Math.max(0, Math.trunc(params.limit ?? 20));
    const offset = Math.max(0, Math.trunc(params.offset ?? 0));
    const ts = await invoke<LocalTranscription[]>("transcription_list", { limit, offset });
    return ts.map(fromLocalTranscription);
  }
  // ... delete/update/audio_load/purge → invoke("transcription_delete"|"transcription_update"|...)
}
The 3-variant example — src/repos/term.repo.ts: LocalTermRepo → invoke("term_list"); CloudTermRepo → invokeHandler("term/listMyTerms", {}) from @voquill/functions (Firebase-backed cloud); EnterpriseTermRepo → invokeEnterprise("term/listMyTerms", {}) (src/utils/enterprise.utils.ts, routes to the enterprise gateway).
Factories (src/repos/index.ts):
export const getTermRepo = (): BaseTermRepo => {
  if (isEnterprise()) return new EnterpriseTermRepo();
  return isLoggedIn() ? new CloudTermRepo() : new LocalTermRepo();
};
export const getTranscriptionRepo = (): BaseTranscriptionRepo => new LocalTranscriptionRepo();
export const getApiKeyRepo = (): BaseApiKeyRepo => new LocalApiKeyRepo();
There are also provider-family repos: generate-text.repo.ts (OpenAI/Groq/Claude/Gemini/Ollama/OpenRouter/Azure/…), transcribe-audio.repo.ts, model-provider.repo.ts — selected by user prefs (getTranscribeAudioRepo(), getGenerateTextRepo() return { repo, apiKeyId, warnings }).
2.4 Actions pattern (src/actions/)
Actions are plain async functions (not Zustand actions) that: read state via getAppState(), call a repo, then patch state via produceAppState, and surface errors with showErrorSnackbar. Files: api-key.actions.ts, app.actions.ts, transcriptions.actions.ts, settings.actions.ts, user.actions.ts, updater.actions.ts, tone.actions.ts, dictionary.actions.ts, hotkey.actions.ts, chat.actions.ts, login.actions.ts, member.actions.ts, pricing.actions.ts, payment.actions.ts, remote-*.actions.ts, etc. Representative excerpt (src/actions/api-key.actions.ts):
export const loadApiKeys = async (): Promise<void> => {
  const status = getAppState().settings.apiKeysStatus;
  if (status === "loading" || status === "success") return;
  if (loadApiKeysPromise) return loadApiKeysPromise;      // dedupe in-flight
  produceAppState((draft) => { draft.settings.apiKeysStatus = "loading"; });
  loadApiKeysPromise = getApiKeyRepo().listApiKeys()
    .then((apiKeys) => produceAppState((draft) => {
        registerApiKeys(draft, apiKeys);
        draft.settings.apiKeys = sortApiKeys(apiKeys);
        draft.settings.apiKeysStatus = "success";
      }))
    .catch((error) => {
      produceAppState((draft) => { draft.settings.apiKeysStatus = "error"; });
      showErrorSnackbar("Failed to load API keys. Please try again.");
    })
    .finally(() => { loadApiKeysPromise = null; });
  return loadApiKeysPromise;
};
UI → side-effects wiring: components rarely call actions directly on mount; instead “SideEffects” components (TranscriptionsSideEffects.tsx, HomeSideEffects, AppSideEffects.tsx, MigratorSideEffects, …) run useAsyncEffect/useIntervalAsync/useTauriListen and write to the store. Example (src/components/transcriptions/TranscriptionsSideEffects.tsx):
export const TranscriptionsSideEffects = () => {
  useAsyncEffect(async () => {
    const transcriptions = await getTranscriptionRepo().listTranscriptions();
    produceAppState((draft) => {
      registerTranscriptions(draft, transcriptions);
      draft.transcriptions.transcriptionIds = transcriptions.map((t) => t.id);
    });
  }, []);
  useOnExit(() => produceAppState((d) => Object.assign(d.transcriptions, INITIAL_TRANSCRIPTIONS_STATE)));
  return null;
};
2.5 Tauri commands (Rust)
- /home/omar/Desktop/foss/voquill/apps/desktop/src-tauri/src/commands.rs (~2,500+ lines, 118 commands). Every command is:
#[tauri::command]
#[specta::specta]                      // tauri-specta for TS bindings
pub async fn transcription_create(
    transcription: crate::domain::TranscriptionCreateArgs /* or similar */,
    database: State<'_, crate::state::OptionKeyDatabase>,
) -> Result<crate::domain::Transcription, String> {
    crate::db::transcription_queries::insert_transcription(database.pool(), &transcription)
        .await
        .map_err(|err| err.to_string())
}
  Commands delegate to src-tauri/src/db/*_queries.rs (sqlx) or src-tauri/src/platform/, src-tauri/src/system/ modules; errors are stringified (Result<T, String>); response structs derive serde::Serialize + specta::Type with #[serde(rename_all = "camelCase")].
- Registration: /home/omar/Desktop/foss/voquill/apps/desktop/src-tauri/src/app.rs, .invoke_handler(tauri::generate_handler![ crate::commands::user_get_one, crate::commands::user_set_one, ... ]) starting at line 220 (~119 entries: user/preferences, auth (custom token + Google OIDC + enterprise OIDC), microphones/GPU/monitor, permissions, app targets, paired remote devices + remote receiver/sender, recording, audio storage, tray, api keys, tones, terms, hotkeys, conversations/chat messages, accessibility/paste, wakeword, floating windows, diagnostics, etc.).
- Rust module layout: src-tauri/src/{app.rs, commands.rs, errors.rs, overlay.rs, pill_process.rs, db/, domain/, platform/, state/, system/, utils/}. Managed state: state/ (OptionKeyDatabase(SqlitePool), GoogleOAuthState, OverlayState, FloatingWindowState, RemoteReceiverState).
- TS bindings: #[specta::specta] + cargo run --example gen_bindings (scripts/bindings.sh, apps/desktop/src-tauri/examples/gen_bindings.rs) → emits packages/desktop-native-apis/src/bindings.ts (export const commands = { async userGetOne(): Promise<Result<User|null,string>> ... }, camelCase wrappers with Result tagging). However, in practice the app's repos call invoke("snake_case_cmd", args) directly from @tauri-apps/api/core, not the generated bindings.
2.6 Database migrations
- Dir: apps/desktop/src-tauri/src/db/migrations/NNN_description.sql, currently 000_schema.sql … 068_app_target_insertion_method.sql (no gaps; 021 appears skipped/renumbered as 022+ — versions 0–68 exist as files).
- Registered in apps/desktop/src-tauri/src/db/mod.rs two ways (both required):
1. include_str! constants: pub const API_KEYS_MIGRATION_SQL: &str = include_str!("migrations/009_api_keys.sql");
2. appended to pub fn migrations() -> Vec<tauri_plugin_sql::Migration> as:
tauri_plugin_sql::Migration {
    version: 68,
    description: "add_app_target_insertion_method",
    sql: APP_TARGET_INSERTION_METHOD_MIGRATION_SQL,
    kind: tauri_plugin_sql::MigrationKind::Up,
},
- Applied by tauri-plugin-sql against sqlite:voquill.db (declared in src-tauri/tauri.conf.json → plugins.sql, and DB_CONNECTION const in db/mod.rs). Query layer: db/<entity>_queries.rs (e.g. transcription_queries.rs, api_key_queries.rs) using sqlx SqlitePool from State<'_, OptionKeyDatabase>.
- Naming convention for a new migration: next integer + snake_case description, e.g. 069_something.sql + SOMETHING_MIGRATION_SQL const + {version: 69, description: "add_something", ...}.
2.7 Settings/configuration screens
- src/components/settings/SettingsPage.tsx (route /dashboard/settings): sections General (auto-launch switch, Microphone, Audio, Wake words, Hotkeys, Diagnostics, Text insertion, More settings), Processing (dictation language select, AI transcription, AI post-processing, Assistant mode), Advanced (change password, manage subscription, terms, sign out), Danger zone (clear local data / delete account).
- Settings state: src/state/settings.state.ts — dialog-open booleans (microphoneDialogOpen, aiTranscriptionDialogOpen, …) plus data (aiTranscription, aiPostProcessing, agentMode, apiKeys, hotkeyIds, openRouterModels). Opening a dialog = produceAppState((d) => { d.settings.xxxDialogOpen = true; }).
- Dialogs: AudioDialog, MicrophoneDialog, WakeWordDialog, ShortcutsDialog, AppKeybindingsDialog, AITranscriptionDialog, AIPostProcessingDialog, AIAgentModeDialog, MoreSettingsDialog, DiagnosticsDialog, MultiDeviceDialog, DictationLanguageDialog, ClearLocalDataDialog, DeleteAccountDialog, ProfileDialog — all in src/components/settings/. Root-level dialogs are mounted in RootDialogs.tsx; dashboard-level in DashboardPage.tsx.
- API key management UI: ApiKeyList.tsx, api-key-provider-config.tsx, ProviderFormFields.tsx, VoquillCloudSetting.tsx, provider pickers (OllamaModelPicker, OpenRouterModelPicker, …).
- Persisted prefs: UserPreferences row in SQLite (via user_preferences_set/get commands + preferences.repo.ts LocalUserPreferencesRepo); UI-only toggles go to persisted zustand local slice.
2.8 Notifications
- There are no OS-level notifications. In-app feedback = snackbar toasts: state (snackbarMessage/Counter/Mode/Duration) set via src/actions/app.actions.ts → showSnackbar() / showErrorSnackbar() (helpers setSnackbar in utils/app.utils.ts), rendered by src/components/root/SnackbarEmitter.tsx (MUI Snackbar, bottom-center, keyed by snackbarCounter).
- Overlay “pill” flash messages: sendPillFlashMessage() / sendPillFireworks() in src/utils/overlay.utils.ts (Rust set_phase/overlay events).
- Rust→TS event push exists (app_handle.emit_to(...), e.g. Google OAuth event; constants like EVT_OVERLAY_PHASE, EVT_AUDIO_CHUNK in domain), consumed in TS via useTauriListen (src/hooks/tauri.hooks.ts, wrapping @voquill/desktop-utils).
2.9 History / records display
- Route /dashboard/transcriptions → src/components/transcriptions/TranscriptionsPage.tsx (uses ScrollListPage + TranscriptionRow (TranscriptRow.tsx), data loaded by TranscriptionsSideEffects, ids in state.transcriptions.transcriptionIds, entities in transcriptionById).
- Details/ops: TranscriptionDetailsDialog.tsx, RetranscribeDialog.tsx, FlagTranscriptionDialog.tsx, TranscriptionToneMenu.tsx, AudioPlayerPill.tsx (audio playback via transcription_audio_load).
- Home page (src/components/home/HomePage.tsx) shows streak/WPM stat cards + recent TranscriptionRows.
2.10 Screenshot capture / timer / scheduler logic
- No screenshot capture exists anywhere (grep of TS and Rust for screenshot|capture|ScreenCapture → nothing). Screen-related commands are limited to get_monitor_at_cursor, get_screen_visible_area, get_screen_context (accessibility text), gather_accessibility_dump.
- No cron/scheduler crate in Rust; tokio is available (features = ["time", ...] in src-tauri/Cargo.toml) but periodic work lives in TS (see §4). Rust background work = long-lived threads/loops: pill_process.rs (std::thread::spawn x2), platform/macos/overlay.rs, system/wakeword_listener.rs, system/remote_receiver.rs, key listener commands (start_key_listener/stop_key_listener), system/tray.rs.
- Timer-ish utilities: src/utils/time.utils.ts (minutesToMilliseconds, hoursToMilliseconds), src/utils/dictation-limit.utils.ts (dictation minute limits), useInterval/useIntervalAsync hooks (§4), plus wakeword config commands (list_wakeword_models, get/set_wakeword_config).
2.11 API keys / credentials storage
- Table api_keys (migration 009_api_keys.sql) with columns extended over time (026 model, 034 openrouter_config, 035 base_url, 036 azure_region, 056 include_v1_path).
- Encryption at rest (Rust): src-tauri/src/system/crypto.rs — protect_api_key() derives salt (OsRng), SHA-256 hash, and XOR-keystream ciphertext keyed by runtime_secret() = env VOQUILL_API_KEY_SECRET (falls back to a hard-coded default with a warning); reveal_api_key(salt, ciphertext) reverses it. Only last-4 key_suffix is stored in plaintext. See api_key_create/api_key_list in commands.rs (lines ~1035–1100): stored as ApiKey { salt, key_hash, key_ciphertext, key_suffix, ... }, returned to TS as ApiKeyView with keyFull revealed.
- TS side: src/repos/api-key.repo.ts (LocalApiKeyRepo → api_key_list/create/update/delete), state in apiKeyById + settings.apiKeys; actions in src/actions/api-key.actions.ts. Note keys are revealed to the frontend and used from TS (repos read apiKeyRecord.keyFull).
- Other credentials: auth session in Rust system/auth_session.rs + commands auth_sign_in_with_custom_token|auth_mint_custom_token|auth_sign_out|auth_is_signed_in; Google OAuth secrets via env (VOQUILL_GOOGLE_CLIENT_ID/SECRET); enterprise gateway token in settings.agentMode.openclawToken etc.
- There is no OS keychain/keyring integration — encryption is the XOR scheme above.
2.12 IPC / invoke pattern (TS ↔ Rust)
- Command calls: import { invoke } from "@tauri-apps/api/core" used directly inside repos/actions, always with snake_case command names and camelCase-ish arg keys matching Rust parameter names, e.g. invoke<LocalTerm[]>("term_list"), invoke("transcription_create", { transcription }), invoke("api_key_update", { request }). Return values are untyped-with-local-type: each repo declares a LocalXxx type mirroring the Rust #[serde(rename_all = "camelCase")] struct, then fromLocalXxx() maps to the @voquill/types domain type.
- Typed bindings exist but are peripheral: packages/desktop-native-apis/src/bindings.ts (generated commands.* camelCase wrappers returning Result<T,string>); regenerate with root pnpm run gen:bindings / scripts/bindings.sh (cargo run --example gen_bindings).
- Events Rust→TS: useTauriListen(eventName, cb) (src/hooks/tauri.hooks.ts → @voquill/desktop-utils, errors routed to snackbar). Events TS→(pill/window): emit helpers in src/utils/overlay.utils.ts, window.utils.ts.
- Guard pattern for non-Tauri env: settings.actions.ts isTauriEnvironment() checks __TAURI_INTERNALS__ etc.
3. Where the logo/title is in the top bar (target for a “dashboard switcher” dropdown)
The header lives at /home/omar/Desktop/foss/voquill/apps/desktop/src/components/root/Header.tsx and is rendered for all dashboard routes by AppWrapper in router.tsx via PageLayout header={<AppHeader />} (src/components/common/PageLayout.tsx — sticky top Stack, scrollable children).
// Header.tsx
export const BaseHeader = ({ logo, leftContent, rightContent }: BaseHeaderProps) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, px: 2 }}>
    <Box sx={{ py: 0.5, pr: 1 }}>{logo}</Box>
    {leftContent}
    <Box sx={{ flexGrow: 1 }} />
    {rightContent}
  </Stack>
);

export const AppHeader = () => {
  const logo = (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box onClick={handleLogoClick} sx={{ cursor: "pointer" }}>   {/* nav("/") */}
        <LogoWithText />
      </Box>
      <SenderReceiverChip />
    </Stack>
  );
  return <BaseHeader logo={logo} leftContent={leftContent} rightContent={rightContent} />;
};
- LogoWithText = src/components/common/LogoWithText.tsx (<Logo /> from common/Logo.tsx + bold “Voquill” Typography, hidden on xs). SenderReceiverChip sits immediately right of the logo — a precedent for putting a compact chip/control next to the logo.
- Right side of the header: GPU upgrade button, FreeWordsRemaining, TrialCountdown, then a MenuPopoverBuilder avatar menu (profile, upgrade) — src/components/common/MenuPopover.tsx is the existing reusable dropdown/popover pattern to copy for a dashboard selector.
- There is also a header extension point: HeaderPortalProvider (src/components/root/HeaderPortalContext.tsx + src/hooks/header.hooks.ts → useSetHeaderContent(node)) lets pages inject leftContent next to the logo (currently leftContent slot, rendered after the logo box).
Recommended insertion point for the “switch dashboards” dropdown: the logo Stack in AppHeader (between LogoWithText and SenderReceiverChip), or the leftContent slot; use MenuPopoverBuilder for the dropdown UI.
4. Background tasks / periodic jobs patterns
All periodic work is frontend-driven; there is no Rust scheduler/cron.
1. useInterval / useIntervalAsync — src/hooks/helper.hooks.ts (lines 212–260): useInterval(delay, cb, deps) runs immediately then every delay; useIntervalAsync wraps it with a re-entrancy guard (running ref). This is the canonical polling primitive.
2. Interval constants use minutesToMilliseconds/hoursToMilliseconds from src/utils/time.utils.ts. Example in src/components/root/AppSideEffects.tsx:
- useIntervalAsync(CONFIG_REFRESH_INTERVAL_MS, ...) — refresh FullConfig
- useIntervalAsync(ENTERPRISE_REFRESH_INTERVAL_MS, ...) — reload enterprise target/config/license/OIDC providers
- useIntervalAsync(TOKEN_REFRESH_INTERVAL_MS, ...) — getAuthRepo().refreshTokens()
- useIntervalAsync(minutesToMilliseconds(1), ...) — misc refresh (line ~665)
3. Interval inside useEffect — e.g. src/components/root/AffordancesSideEffects.tsx: hourly setInterval(check, REMINDER_CHECK_INTERVAL_MS) with cooldown/threshold timestamps persisted in the zustand local slice (lastDictationReminderShownAt, lastDictatedAt).
4. Polling for external state: OllamaModelPicker.tsx / OpenAICompatibleModelPicker.tsx / MultiDeviceDialog.tsx use local setInterval while a dialog is open.
5. Lifecycle pattern: side-effect components are mounted where they should be active (Root.tsx for app-lifetime, *Page for page-lifetime, e.g. TranscriptionsSideEffects, HomeSideEffects) and clean up via returned clearInterval/useOnExit.
6. Rust side: long-running capabilities are exposed as start/stop commands holding state (e.g. start_key_listener/stop_key_listener, start_wakeword_listener, remote_receiver_start/stop), with progress/results pushed back via emit events consumed by useTauriListen. tokio (with time feature) is available if a Rust-side interval is ever needed; tauri-plugin-autostart handles launch-at-login.
Cheat-sheet of the most useful files for planning a new feature
Concern	File
Routes	apps/desktop/src/router.tsx
Header / logo	apps/desktop/src/components/root/Header.tsx, common/LogoWithText.tsx, common/MenuPopover.tsx, hooks/header.hooks.ts
Dashboard shell/nav	components/dashboard/DashboardPage.tsx, DashboardMenu.tsx, DashboardEntryLayout.tsx
Store	src/store/index.ts, state/app.state.ts, state/<slice>.state.ts
Actions	src/actions/*.actions.ts (pattern: api-key.actions.ts)
Repos	src/repos/index.ts (factories), term.repo.ts (Local/Cloud/Enterprise), transcription.repo.ts (Local)
Rust commands	src-tauri/src/commands.rs, registration in src-tauri/src/app.rs (line 220+)
DB	src-tauri/src/db/mod.rs, db/migrations/NNN_*.sql, db/<entity>_queries.rs
Settings UI	components/settings/SettingsPage.tsx + dialogs; state/settings.state.ts; actions/settings.actions.ts
Toasts	actions/app.actions.ts → components/root/SnackbarEmitter.tsx
Periodic jobs	hooks/helper.hooks.ts (useIntervalAsync), components/root/AppSideEffects.tsx
Credentials	src-tauri/src/system/crypto.rs, commands.rs::api_key_*, repos/api-key.repo.ts
Global lifecycle	components/root/Root.tsx, AppSideEffects.tsx, *SideEffects.tsx
