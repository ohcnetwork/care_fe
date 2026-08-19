## Plugin Discovery & Setup

- Build-time plugins (every Vite command: `dev`, `build`, preview): `REACT_ENABLED_APPS`.
- Format: `org/repo` or `org/repo@host/path/to/remoteEntry.js`.
- Vite `command === "serve"` (includes `npm run dev` and `npm run local` / `vite --mode docker`; not `vite build`): also auto-discovers `apps/*/src/manifest.tsx` and loads that source through the host Vite graph. Local overwrites env only when the directory name equals the env plugin `name` (the repo). A mismatched folder is a second plugin, not a replacement.

## Build-time vs. Runtime

- Build-time plugins come from `getBuildTimePlugConfigs()` in `src/Utils/plugConfig.ts`: `REACT_ENABLED_APPS` (`careConfig.careApps`) plus, when Vite `command === "serve"`, `apps/` (`localDevPluginConfigs`). There is no `npm run setup` and `src/pluginMap.ts` is an unused empty stub (removed as a generator in Plugin Architecture V3, [#16229](https://github.com/ohcnetwork/care_fe/pull/16229)).
- The backend can also return plugins from `GET /api/v1/plug_config/` (database rows). Admin `/admin/apps` is that list: create/edit/delete those rows. It does not show `REACT_ENABLED_APPS` or `apps/` plugins.
- `mergePlugConfigs()` combines API + build-time at runtime for `PluginEngine` and `initI18n()`. `source: "build"` / `isReadOnly: true` apply to that merged list, not the admin page.

See `docs/care-apps-architecture-note.md` for merge rules and slug overwrite.

## Vite Federation Architecture

This is the **remote** path (`remoteEntry.js`). Vite `serve` + a matching `apps/<repo>/` skips it (see Local Dev Workflow below).

- **Host** (`vite.config.mts`): federation name `"core"`. `remotes: { dummy: "" }` only enables the federation API; it does not list plugins. Shared: `react`, `react-dom`, `react-i18next`, `@tanstack/react-query`, `raviger`, `sonner`, `decimal.js`.
- **Plugin repo** (its own Vite config, not something shipped under host `apps/`): `federation({ exposes: { "./manifest": "./src/manifest.tsx" } })` (some plugins use `manifest.ts`). `vite build` writes `dist/assets/remoteEntry.js`. Example: [care_hello_fe](https://github.com/ohcnetwork/care_hello_fe) — clone it separately; it is not vendored here.
- **URL** comes from `care.config.ts` parsing `REACT_ENABLED_APPS`, not from Vite `remotes`. No `@` → GitHub Pages `https://{org}.github.io/{repo}`. With an `@` suffix, the whole post-`@` string is `{scheme}://{cdn}` (including the path to `remoteEntry.js`); scheme is `http` if that string contains `localhost`, else `https` (a LAN IP therefore gets `https`). That becomes `meta.url`.
- **Runtime** (`PluginEngine.tsx`): if `localDevPluginManifests[slug]` is missing, `setFederationRemote(slug, { url: meta.url })` then `getFederationRemote(slug, "./manifest")`.

## Local Dev Workflow (primary: in-tree)

The recommended way to develop a plugin against the host is to **copy or clone** the
plugin checkout into the host's `apps/` directory and run the **host** dev server. Do
not `ln -s`: the scanner uses `Dirent.isDirectory()`, so a symlink is skipped. No
separate plugin build, preview, or `REACT_ENABLED_APPS` entry is required — the host
auto-discovers the plugin and loads its source directly through its own Vite graph with
full HMR.

- Place the plugin at `apps/<slug>/` so its manifest lives at `apps/<slug>/src/manifest.tsx`.
  The slug is the directory name. To replace a `REACT_ENABLED_APPS` entry, it must equal
  that plugin's `name` (the repo, e.g. `care_hello_fe`).
- Start the host with Vite `serve` (`npm run dev` or `npm run local`) → vite on `:4000`.
- The host's `localPluginDevSupport()` plugin (in `vite.config.mts`) discovers every
  `apps/*/src/manifest.tsx`, registers each plugin, and serves it from host source.
- Edits to plugin source trigger HMR (and a full reload when a manifest is added/removed),
  because the plugin code is part of the host module graph — no rebuild step.

See **Dev-Mode Local Discovery (shipped)** below for exactly what the host does.

### Standalone alternative (remote-style, port 4173)

When you need to exercise the real federated `remoteEntry.js` path (e.g. testing the
production loading flow) rather than in-tree source, run the plugin as a standalone remote.
Do **not** also put a folder named that repo under host `apps/` — on Vite `serve`,
directory name === `plugin.name` means the local config replaces the env one and
the env URL is unused. A differently named folder still loads the remote as a
second plugin.

- Sample plugin ([care_hello_fe](https://github.com/ohcnetwork/care_hello_fe), not vendored
  here): `npm run dev` → `vite preview` on **hello’s** `:4173` + `vite build --watch` keeps
  `dist/assets/remoteEntry.js` fresh. Other plugins set their own preview port.
- Point the host at it: `REACT_ENABLED_APPS=ohcnetwork/care_hello_fe@localhost:4173/assets/remoteEntry.js`.
- The plugin exposes `remoteEntry.js` at `dist/assets/` and serves it from that preview port.
- No HMR from plugin to host. After `remoteEntry.js` rebuilds, **refresh the CARE tab**
  (`:4000`). The host does not auto-reload.

## HMR & Watch Status

- The host dev server does not watch `tests/`, `test/`, `*.test.*`, `*.spec.*`, `playwright-report/`, or `test-results/`. That list is `server.watch.ignored` in `vite.config.mts`.
- In-tree dev (primary): the host watches `apps/` directly. Plugin source edits HMR through
  the host graph; adding/removing an `apps/*/src/manifest.tsx` triggers a full reload.
- Standalone remote mode (alternative): `vite build --watch` keeps `dist/assets/remoteEntry.js`
  fresh. There is no HMR back to the host — **refresh the CARE tab** after the plugin rebuild.

## Dev-Mode Local Discovery (shipped)

Implemented by `localPluginDevSupport()` in `vite.config.mts`. On Vite
`command === "serve"` (`npm run dev`, `npm run local` / `vite --mode docker`,
and any other `vite` dev-server invocation) the host scans `apps/` and wires
local plugins into its own module graph — no separate plugin build, plugin
preview, or `REACT_ENABLED_APPS` entry needed. `vite build` is `"build"` and
emits an empty list; `npm run preview` serves that dist, so it does not
re-scan `apps/` into the page.

- **Auto-discovery:** every immediate `apps/<slug>/` directory whose `src/manifest.tsx`
  exists becomes a local plugin (sorted by slug). Each is exposed through the virtual module
  `virtual:care-local-plugins` as `localDevPluginConfigs` / `localDevPluginManifests`. Each
  config entry has the shape `{ slug: "<slug>", meta: { name: "<slug>", localPath:
  "/local-plugins/<slug>", package: "local/<slug>" } }` (the `meta` object satisfies
  `PlugConfigMeta` from `src/types/plugConfig.ts`). There is **no `meta.url`**.
  `getBuildTimePlugConfigs()` spreads that object into a `PlugConfig` whose
  `meta.url` is what `PluginEngine` validates on the federation path — local
  plugins never hit that check because `getPluginManifest()` returns on
  `localDevPluginManifests[slug]` first. Do not add a `url` requirement in
  front of that short-circuit; it would silently break in-tree serve.
  `getBuildTimePlugConfigs()` then
  `Map.set`s env plugins by `plugin.name` (repo) and these by directory slug. Equal
  strings → local overwrites env. Unequal (`apps/hello` vs `ohcnetwork/care_hello_fe`)
  → two plugins.
- **`@/` → `/@fs/` rewrite:** imports inside plugin source that use `@/` are rewritten to
  `/@fs/<absolute path>` only when that file exists under the plugin's `apps/<slug>/src`.
  If it does not, the `@/` import is left unchanged and Vite's host alias `@` → `src/`
  resolves it (plugin file wins, else host file). That is two steps, not one lookup.
  Plugins can use the same `@/*` convention as the host while living under `apps/`.
- **`/local-plugins/<slug>` asset serving:** a dev middleware serves files from
  `apps/<slug>/public/` at `/local-plugins/<slug>/...` (path-traversal guarded, `no-store`),
  so plugin static assets resolve without a build step.
- **Tailwind:** the host scans `./apps/**` via the `content:` array in
  `tailwind.config.js` (wired into the v4 pipeline by `@config "../../tailwind.config.js"`
  in `src/style/index.css`), and the plugin's own `@import "tailwindcss"` lines are stripped
  in dev (the host already provides theme/preflight/utilities), so plugin classes work
  without re-running preflight.
- **Shared deps / no duplicate React:** federation shares react, react-dom, react-i18next,
  @tanstack/react-query, raviger, sonner, decimal.js, and `resolve.dedupe` forces plugin
  source to use the host's single copy — avoiding "Should have a queue" / hook-order errors.
- **Full HMR:** because plugin source is part of the host graph, editing it hot-reloads via
  the host Vite `serve` process; adding/removing a manifest triggers a full reload.

For the manifest contract these plugins must satisfy, see `src/pluginTypes.ts`.

## Cloning Components Into a Plugin (`scripts/clone-component.ts`)

Plugins cannot import host `src/` in production (federation only shares a few
packages such as React). To reuse a host component, copy it into the plugin with
this CLI. It photocopies the file and every local file it imports (JS/TS plus
images/CSS those files import) into `apps/<plugin>/src/`. Runtime loading
(`apps/` vs `remoteEntry.js`) is separate.

### Invocation

Run from the **care_fe host repo**, not from the plugin checkout. The plugin must
already exist at `apps/<target-app>/` with a `src/` directory. A checkout anywhere
else, or a plugin loaded only via `REACT_ENABLED_APPS`, is not enough — the
command throws `Target app not found`.

```bash
# from care_fe
npm run clone-component -- <source> <target-app> [flags]

# or
npx tsx scripts/clone-component.ts <source> <target-app> [flags]
```

Arguments:

- `<source>` — the entry component. Accepts:
  - workspace-relative path: `src/components/Common/Loading.tsx`
  - absolute path
  - host alias: `@/components/ui/button`, `@core/components/ui/button`, `@careConfig`
- `<target-app>` — directory name under host `apps/` (example slugs: `care_hello_fe`).
  That folder must already be present.

Flags:

- `-f, --force` — overwrite files that already exist in the plugin.
- `-n, --dry-run` — report what would be copied without writing anything.
- `-h, --help` — show usage.

### What it does

- From each JS/TS file it copies, it follows static imports: `import … from "…"`,
  `export … from "…"`, `import("…")`, and `require("…")` when the path is a
  quoted string. It does not follow `import("./" + name)` or commented-out
  imports.
- For those paths it finds the real file (tries `.ts` / `.tsx` / `.js` / … and
  `index.*` in a folder), then copies it to the same place under
  `apps/<target-app>/src/`.
- Images, fonts, lottie, and `.css` files that JS/TS imported are copied as-is
  (no text rewrite). The script does not open CSS to follow `@import` or `url()`.
- Rewrites host-only path aliases to ones the plugin tsconfig understands:
  - `@core/foo` → `@/foo`
  - `@careConfig` → `@/care.config` (and copies `care.config.ts` into `apps/<target-app>/src/`)
  - `@/foo` is left as-is (plugins use the same `@/*` alias).
- Skips existing files unless `--force` is passed.
- Collects bare-specifier imports and syncs any missing packages into the target app's `package.json` using the version and dependency section from the host `package.json`.

### Output

A summary is printed at the end:

- `✓ Copied` — files written (or that would be written under `--dry-run`).
- `• Skipped` — files already present in the target app; re-run with `--force` to replace.
- `• External packages referenced` — bare-specifier imports encountered (e.g. `react`, `@radix-ui/react-slot`).
- `✓ Synced` — packages added to the target app's `package.json` (or that would be added under `--dry-run`).
- `• Packages already present` — dependencies the target app already declares.
- `• Skipped Node builtins` — built-in Node modules that do not belong in `package.json`.
- `! External packages missing from the root package.json` — packages the script could not source a version for automatically.
- `! Unresolved imports` — specifiers that could not be resolved to a file in `src/` or `care.config.ts`. These need manual attention (often host-only modules outside `src/` such as `vite-env.d.ts`-style globals).

### Examples

```bash
# from care_fe; apps/care_hello_fe must already exist
npm run clone-component -- @/components/ui/button care_hello_fe --dry-run

npm run clone-component -- src/pages/Appointments/BookAppointment/BookAppointmentDetails.tsx care_hello_fe --force

npm run clone-component -- @careConfig care_hello_fe
```

### Caveats

- Only files under host `src/` (and `care.config.ts`) are followed. Imports that resolve outside those roots are reported as unresolved.
- The CLI updates the target app's `package.json`, but it does not run `npm install`.
- Auto-sync only works for packages that already exist in the host `package.json`; anything else is still reported for manual follow-up.
- Once cloned, files are independent copies. They will not stay in sync with the host; re-run with `--force` to refresh.
