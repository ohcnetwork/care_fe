# Plugin Loading Note For AI Agents

`PluginEngine` resolves enabled plugins in two stages:

1. It fetches plugin configs from `GET /api/v1/plug_config/`.
2. It merges that API response with build-time plugins from `getBuildTimePlugConfigs()` in `src/Utils/plugConfig.ts`.

Build-time plugins are the base enabled set. They load even when the backend has no matching `plug_config` row. That set has two inputs, both tagged `source: "build"`:

- `careConfig.careApps`, parsed from `REACT_ENABLED_APPS` (every Vite command: `dev`, `build`, Playwright). This is the production path: Module Federation via a remote URL.
- `localDevPluginConfigs`, from `apps/*/src/manifest.tsx`. **`apps/` is local development only — not production.** It is scanned only on host `npm run dev`. `vite build`, Playwright, staging, and production do not load plugins from `apps/`; they use `REACT_ENABLED_APPS` and/or `plug_config`.

If the same slug appears in both, the `apps/` entry overwrites the env entry (config and later the in-tree manifest). The `REACT_ENABLED_APPS` remote URL for that slug is ignored until the folder is removed from `apps/`.

Build-time plugin identity:

- `REACT_ENABLED_APPS` is parsed by `care.config.ts` into `careConfig.careApps`.
- Each build-time plugin is normalized into the same `PlugConfig` shape as the API response by `src/Utils/plugConfig.ts`.
- The resolved `slug` for a build-time plugin is the parsed plugin `name` field, which is typically the repository name.

`REACT_ENABLED_APPS` format:

- Each entry is expected in the form `org/repo` or `org/repo@host/path/to/remoteEntry.js`.
- If `@host/path` is omitted, CARE defaults to GitHub Pages: `https://{org}.github.io/{repo}`.
- If the host contains `localhost`, CARE prefixes it with `http://`; otherwise it prefixes it with `https://`.
- In host `npm run dev` only (not production), CARE auto-discovers local plugin apps from `apps/*/src/manifest.tsx` and loads them through the host Vite graph. Production still uses Module Federation.
- Example remote entry for non-hosted local testing or preview flows: `ohcnetwork/care_hello_fe@localhost:4173/assets/remoteEntry.js`.

Merge behavior:

- API-only plugins remain editable and keep `source: "api"`.
- Build-time plugins are always marked `source: "build"` and `isReadOnly: true`.
- If API and build-time provide the same slug, the frontend keeps one merged entry for that slug.
- For overlapping metadata keys, build-time metadata wins.
- API-only metadata keys that do not conflict are preserved.
- If env and `apps/` both provide the same slug, `apps/` wins among the two build-time inputs (see above). That is independent of the API merge.

For each resolved plugin config, `PluginEngine`:

1. If `localDevPluginManifests[slug]` exists (host `npm run dev` + `apps/`), uses that source manifest and skips federation.
2. Otherwise validates `config.meta.url`, registers the remote with Vite federation using the plugin `slug`, and loads `./manifest`.
3. Combines the manifest with `config.meta`.
4. After plugins resolve, writes frozen `window.__CARE_PLUGIN_RUNTIME__ = { meta: { [slug]: PlugConfigMeta } }`.
5. Registers plugin overrides through `addOverride(...)`.
6. Makes the loaded manifests available through `CareAppsContext`.

Failure behavior (federation path only — after `localDevPluginManifests[slug]` is missing):

- In-tree plugins (`apps/` on host `dev`) have no remote URL and are not skipped; they already returned at step 1.
- If `config.meta.url` is missing or invalid, the plugin is logged and skipped.
- If the remote manifest cannot be loaded, the plugin is logged and skipped.
- These failures do not prevent the rest of the app or other plugins from loading.

`PLUGIN_Component` renders plugin-provided React components by looking them up in each loaded manifest's `components` map.

`initI18n()` also uses the same merged plugin-config list to discover plugin namespaces and translation origins. If the `plug_config` API call fails, the app still falls back to build-time plugins for i18n namespace discovery.

Admin UI behavior:

- `/admin/apps` lists only `GET /api/v1/plug_config/` rows (`PlugConfigList`). It does not show `REACT_ENABLED_APPS` or `apps/` plugins, and it does not use `mergePlugConfigs` or `isReadOnly`.
- `/admin/apps/:slug` always loads `GET /api/v1/plug_config/{slug}/` and is a normal edit form (save/delete). There is no read-only built-in detail view for build-time plugins.
- API-backed rows remain editable in that UI. `source: "build"` / `isReadOnly: true` apply only to the merged runtime list used by `PluginEngine` and `initI18n()`.
- Build-time plugins still load in the app even when they have no PlugConfig admin row.

Testing vs local-dev (do not mix these paths):

Playwright / `vite build` / production — **`apps/` is not scanned.** `createLocalPluginModule` returns empty arrays unless Vite `command` is `serve`. Playwright's `webServer` is `npm run preview` of that build (`playwright.config.ts`). Plugins in this path come only from `REACT_ENABLED_APPS` (federation URL) and/or `GET /api/v1/plug_config/`. Cloning a plugin into `apps/` in CI does not change that.

- If a plugin should always be present during tests, add it to `REACT_ENABLED_APPS`.
- If a test needs backend-managed plugin metadata only, seed the `plug_config` API response.
- If both API and build-time define the same slug, the frontend keeps one `source: "build"` entry and merges API-only metadata keys under build-time keys.
- Federation / preview example (plugin must be built and served as a remote, **not** sitting in host `apps/` for that slug): `ohcnetwork/care_hello_fe@localhost:4173/assets/remoteEntry.js`. The hello plugin is **not vendored** in this repo; clone [care_hello_fe](https://github.com/ohcnetwork/care_hello_fe) separately and run its preview.

Local plugin iteration — host `npm run dev` only:

- Drop or copy the plugin at `apps/<slug>/` (hello: `apps/care_hello_fe`). CARE loads `src/manifest.tsx` through the host Vite graph and serves `public/` at `/local-plugins/<slug>/`. No `REACT_ENABLED_APPS` entry is required.
- Same slug in `apps/` and `REACT_ENABLED_APPS` on host `dev`: **`apps/` wins** and the env remote URL is ignored. To exercise federation locally, remove that folder from `apps/`.

Local Playwright exception: `reuseExistingServer` is true when `CI` is unset. If host `npm run dev` is already on `:4000`, tests hit the **dev** graph and `apps/` *does* load. That is not the documented test path. CI always starts preview, so `apps/` never loads there.

Host-to-plugin data sharing via `window` globals (plugins cannot import host modules in production):

Set in `src/index.tsx` at startup:

- `window.CARE_API_URL` — Backend API base URL (`careConfig.apiUrl`). It may be `""` for same-origin requests. Plugins use this for HTTP calls.
- `window.AuthUserContext` — The React context object from `src/hooks/useAuthUser.ts`, not the current user. Plugins call `React.useContext(window.AuthUserContext)` (same shared `react` instance) to read `user`, `signIn`, `signOut`, etc. That works because plugin UI renders inside the host `AuthUserProvider`.
- `window.__CORE_ENV__` — The full `careConfig` object (API URLs, feature flags, locales, `careApps`, …).

Set in `PluginEngine` after configs resolve (not in `index.tsx`):

- `window.__CARE_PLUGIN_RUNTIME__` — `{ meta: Record<string, PlugConfigMeta> }`, keyed by plugin **slug**. Example: `window.__CARE_PLUGIN_RUNTIME__.meta.care_abdm_fe.config`. Each value is a frozen copy of that plugin's merged `config.meta`. The `Window` type in `index.tsx` currently types `meta` as a single `PlugConfigMeta`; runtime is the slug map.

See also:

- `src/pluginTypes.ts` — the manifest contract a plugin must satisfy (the source of truth for the `routes`, `components`, tabs, devices, and overrides a manifest can provide).
- `docs/care-apps-local-dev.md` — local plugin development, including the shipped `apps/` auto-discovery dev flow and the `clone-component` CLI (`scripts/clone-component.ts`) for copying host components into a plugin.
