# Plugin Loading Note For AI Agents

`PluginEngine` resolves enabled plugins in two stages:

1. It fetches plugin configs from `GET /api/v1/plug_config/`.
2. It merges that API response with build-time plugins from `careConfig.careApps` (derived from `REACT_ENABLED_APPS`).

The merged list is the effective plugin set used by the frontend. Build-time plugins act as the base enabled plugins, so they load even when the backend does not return a matching `plug_config` row.

Build-time plugin identity:

- `REACT_ENABLED_APPS` is parsed by `care.config.ts` into `careConfig.careApps`.
- Each build-time plugin is normalized into the same `PlugConfig` shape as the API response by `src/Utils/plugConfig.ts`.
- The resolved `slug` for a build-time plugin is the parsed plugin `name` field, which is typically the repository name.

`REACT_ENABLED_APPS` format:

- Each entry is expected in the form `org/repo`, `org/repo@host/path/to/remoteEntry.js`, or `org/repo@/path/to/remoteEntry.js`.
- If `@host/path` is omitted, CARE defaults to GitHub Pages: `https://{org}.github.io/{repo}`.
- If the host contains `localhost`, CARE prefixes it with `http://`; otherwise it prefixes it with `https://`.
- If the URL starts with `/` (e.g. `ohcnetwork/care_scribe_fe@/plugs/care_scribe_fe/assets/remoteEntry.js`), it is kept relative and resolved against the current page origin at load time.
- In host dev mode, CARE auto-discovers valid local plugin apps from `apps/*/src/manifest.*` (any TS/JS extension) and loads them directly through the host Vite graph.
- Example remote entry for non-hosted local testing or preview flows: `ohcnetwork/care_hello_fe@localhost:4173/assets/remoteEntry.js`.

Merge behavior:

- API-only plugins remain editable and keep `source: "api"`.
- Build-time plugins are always marked `source: "build"` and `isReadOnly: true`.
- If both sources provide the same slug, the frontend keeps one merged entry for that slug.
- For overlapping metadata keys, build-time metadata wins.
- API-only metadata keys that do not conflict are preserved.

For each resolved plugin config, `PluginEngine`:

1. Checks that `config.meta.url` is set.
2. Registers the remote with Vite federation using the plugin `slug`, resolving `config.meta.url` against the current page (`new URL(url, window.location.href)`). Both absolute and relative URLs (e.g. `/plugs/<slug>/assets/remoteEntry.js`) are supported.
3. Loads `./manifest` from the remote.
4. Combines the manifest with `config.meta` and exposes the frozen metadata on `window.__CARE_PLUGIN_RUNTIME__.meta`.
5. Registers plugin overrides through `addOverride(...)`.
6. Makes the loaded manifests available through `CareAppsContext`.

Failure behavior:

- If `config.meta.url` is missing or invalid, the plugin is logged and skipped.
- If the remote manifest cannot be loaded, the plugin is logged and skipped.
- These failures do not prevent the rest of the app or other plugins from loading.

Same-origin (relative URL) deployments:

- Relative URLs let a single reverse proxy serve CARE and its plugs (e.g. `/api` → backend, `/plugs/<slug>/` → plug assets, fallback → CARE's `index.html`) and work under any origin it is reached through (LAN IP, mDNS, Tailscale, tunnels), similar to an empty `REACT_CARE_API_URL`.
- Plugin translations are fetched from `{origin of meta.url}/locale/{lng}.json`, which is not resolved for relative URLs. Set `meta.localPath` (e.g. `/plugs/<slug>`) to load them from `{localPath}/locale/{lng}.json`.

`PLUGIN_Component` renders plugin-provided React components by looking them up in each loaded manifest's `components` map.

`initI18n()` also uses the same merged plugin-config list to discover plugin namespaces and translation origins. If the `plug_config` API call fails, the app still falls back to build-time plugins for i18n namespace discovery.

Admin UI behavior:

- API-backed plugin configs remain editable.
- Build-time plugins are shown in the PlugConfig admin page as built-in, read-only entries.
- Direct navigation to a build-time plugin's edit route opens a read-only detail view backed by the build-time config and skips the backend `GET /api/v1/plug_config/{slug}/` request.
- Those built-in entries are still loaded by runtime code even without editable backend state.

Testing guidance:

- If a plugin should always be present during tests, add it to `REACT_ENABLED_APPS` so it becomes a build-time base plugin.
- If a test needs backend-managed plugin metadata only, seed the `plug_config` API response.
- If both sources define the same plugin slug, the frontend keeps the plugin enabled as a build-time plugin and merges API-only metadata keys with the build-time metadata.
- For local host development with the sample hello-world plugin in `apps/care_hello_fe`, start the main app with `npm run dev`. CARE auto-enables local plugins discovered under `apps/` and serves their `public/` assets from the host dev server.
- For remote-style testing or preview flows, a working entry remains `ohcnetwork/care_hello_fe@localhost:4173/assets/remoteEntry.js`, and the sample plugin can still be run from `apps/care_hello_fe` with `npm run dev`.

Host-to-plugin data sharing via `window` globals (set in `src/index.tsx`):

- `window.CARE_API_URL` — The backend API base URL (`careConfig.apiUrl`). Plugins use this to make API calls without importing host modules.
- `window.AuthUserContext` — The React context object for auth state (`AuthUserContext`). Since `react` is a shared dependency, plugins can call `React.useContext(window.AuthUserContext)` to access `signIn`, `signOut`, `user`, etc., because the plugin component tree renders inside the host's `AuthUserProvider`.
- `window.__CORE_ENV__` — The full `careConfig` object (API URLs, feature flags, locale settings, plugin config).
- `window.__CARE_PLUGIN_RUNTIME__` — Plugin-specific runtime metadata (`{ meta: PlugConfigMeta }`) set by `PluginEngine` after the plugin manifest loads.
