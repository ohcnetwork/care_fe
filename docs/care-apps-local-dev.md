## Plugin Discovery & Setup

- Build-time plugins configured via REACT_ENABLED_APPS env var
- format: org/repo or org/repo@host/path/to/remoteEntry.js

## Build-time vs. Runtime

- Build-time plugins: loaded from pluginMap.ts (generated at setup time), become read-only in UI
- API plugins: fetched from /api/v1/plug_config/, editable in UI
- Both merged at runtime by mergePlugConfigs() in src/Utils/plugConfig.ts

## Vite Federation Architecture

- Main app (vite.config.mts): federation with name "core", dummy remote, shared: react/react-dom/i18next/react-query/raviger/sonner/decimal.js
- Per-app (apps/care_hello_fe/vite.config.ts): exposes ./manifest pointing to src/manifest.tsx, builds remoteEntry.js to dist/assets/
- RemoteEntry URL resolving: GitHub Pages if no @ suffix, otherwise http:// for localhost, https:// elsewhere
- Runtime: PluginEngine.tsx uses setFederationRemote() to register each plugin slug dynamically, then getFederationRemote() to load manifest

## Local Dev Workflow (primary: in-tree)

The recommended way to develop a plugin against the host is to drop (or symlink) the
plugin checkout into the host's `apps/` directory and run the **host** dev server. No
separate plugin build, preview, or `REACT_ENABLED_APPS` entry is required — the host
auto-discovers the plugin and loads its source directly through its own Vite graph with
full HMR.

- Place the plugin at `apps/<slug>/` so its manifest lives at `apps/<slug>/src/manifest.tsx`.
- Start the host: `npm run dev` → vite on `:4000`.
- The host's `localPluginDevSupport()` plugin (in `vite.config.mts`) discovers every
  `apps/*/src/manifest.tsx`, registers each plugin, and serves it from host source.
- Edits to plugin source trigger HMR (and a full reload when a manifest is added/removed),
  because the plugin code is part of the host module graph — no rebuild step.

See **Dev-Mode Local Discovery (shipped)** below for exactly what the host does.

### Standalone alternative (remote-style, port 4173)

When you need to exercise the real federated `remoteEntry.js` path (e.g. testing the
production loading flow) rather than in-tree source, run the plugin as a standalone remote:

- Sample plugin: `npm run dev` → `vite preview` on `:4173` + `vite build --watch` keeps
  `dist/assets/remoteEntry.js` fresh.
- Point the host at it: `REACT_ENABLED_APPS=ohcnetwork/care_hello_fe@localhost:4173/assets/remoteEntry.js`.
- The plugin exposes `remoteEntry.js` at `dist/assets/` and serves on preview port `4173`.
- In this mode there is **no automatic HMR back to the host** — the host reloads only after
  the plugin rebuild lands a new `remoteEntry.js`.

## HMR & Watch Status

- Main app server has watch config ignoring tests/playwright/dist folders.
- In-tree dev (primary): the host watches `apps/` directly. Plugin source edits HMR through
  the host graph; adding/removing an `apps/*/src/manifest.tsx` triggers a full reload.
- Standalone 4173 mode (alternative): `vite build --watch` keeps `dist/assets/remoteEntry.js`
  fresh, but there is **no automatic HMR back to the host** — the host reloads only after the
  plugin rebuild.

## Dev-Mode Local Discovery (shipped)

Implemented by `localPluginDevSupport()` in `vite.config.mts`. On `command === "serve"`
the host scans the `apps/` directory and wires local plugins straight into its own module
graph — no separate build, preview, or `REACT_ENABLED_APPS` entry needed.

- **Auto-discovery:** every immediate `apps/<slug>/` directory whose `src/manifest.tsx`
  exists becomes a local plugin (sorted by slug). Each is exposed through the virtual module
  `virtual:care-local-plugins` as `localDevPluginConfigs` / `localDevPluginManifests`, with
  metadata `{ name: slug, localPath: "/local-plugins/<slug>", package: "local/<slug>" }`.
- **`@/` → `/@fs/` rewrite:** imports inside plugin source that use the `@/` alias are
  rewritten to absolute `/@fs/<resolved>` paths, resolved against the plugin's own
  `apps/<slug>/src` (falling back to the host `src/`). This lets a plugin use the same
  `@/*` convention as the host while its files live under `apps/`.
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
  the normal host `npm run dev`; adding/removing a manifest triggers a full reload.

For the manifest contract these plugins must satisfy, see `src/pluginTypes.ts`.

## Cloning Components Into a Plugin (`scripts/clone-component.ts`)

When a plugin needs to reuse a component from the host app, use the
`clone-component` CLI to copy the file along with every local file it
transitively imports into the plugin's `src/` tree.

### Invocation

```bash
# via npm script
npm run clone-component -- <source> <target-app> [flags]

# or directly with tsx
npx tsx scripts/clone-component.ts <source> <target-app> [flags]
```

Arguments:

- `<source>` — the entry component. Accepts:
  - workspace-relative path: `src/components/Common/Loading.tsx`
  - absolute path
  - host alias: `@/components/ui/button`, `@core/components/ui/button`, `@careConfig`
- `<target-app>` — directory name under `apps/` (e.g. `care_voice_fe`, `care_ask_fe`).

Flags:

- `-f, --force` — overwrite files that already exist in the plugin.
- `-n, --dry-run` — report what would be copied without writing anything.
- `-h, --help` — show usage.

### What it does

- Walks the import graph starting from `<source>` through `import`, `export … from`, dynamic `import()`, and `require()` statements.
- Resolves each specifier the same way Vite/TS does (extension probing, `index.*` for directories) for `.ts/.tsx/.js/.jsx/.mjs/.cjs/.json/.css/.scss` and common image/asset extensions.
- Copies every resolved file into `apps/<target-app>/src/...` preserving the path under `src/`.
- Rewrites host-only path aliases to ones the plugin tsconfig understands:
  - `@core/foo` → `@/foo`
  - `@careConfig` → `@/care.config` (and copies `care.config.ts` into `apps/<target-app>/src/`)
  - `@/foo` is left as-is (plugins use the same `@/*` alias).
- Skips existing files unless `--force` is passed.
- Copies binary assets (images, fonts, lottie, etc.) byte-for-byte without rewriting.

### Output

A summary is printed at the end:

- `✓ Copied` — files written (or that would be written under `--dry-run`).
- `• Skipped` — files already present in the target app; re-run with `--force` to replace.
- `• External packages referenced` — bare-specifier imports encountered (e.g. `react`, `@radix-ui/react-slot`). Add any missing entries to the plugin's `package.json` before building.
- `! Unresolved imports` — specifiers that could not be resolved to a file in `src/` or `care.config.ts`. These need manual attention (often host-only modules outside `src/` such as `vite-env.d.ts`-style globals).

### Examples

```bash
# Preview what cloning a button would pull in.
npm run clone-component -- @/components/ui/button care_voice_fe --dry-run

# Actually copy a page component into a plugin and overwrite collisions.
npm run clone-component -- src/pages/Appointments/BookAppointment/BookAppointmentDetails.tsx care_ask_fe --force

# Copy the host care.config.ts shim into a plugin.
npm run clone-component -- @careConfig care_voice_fe
```

### Caveats

- Only files under `src/` (and `care.config.ts`) are followed. Imports that resolve outside those roots are reported as unresolved.
- The CLI does not install npm dependencies or update the plugin's `package.json` — review the "External packages" list and add anything missing.
- Once cloned, files are independent copies. They will not stay in sync with the host; re-run with `--force` to refresh.
