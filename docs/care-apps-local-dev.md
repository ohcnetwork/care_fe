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

## Local Dev Workflow

- Main app: npm run dev → checks/generates pluginMap.ts, runs vite on :4000
- Sample plugin (apps/care_hello_fe): npm run dev → vite preview :4173 + vite build --watch for remoteEntry.js
- Local testing: REACT_ENABLED_APPS=ohcnetwork/care_hello_fe@localhost:4173/assets/remoteEntry.js
- Care_hello_fe exposes remoteEntry.js at dist/assets/ and serves on preview port 4173

## HMR & Watch Status

- Main app server has watch config ignoring tests/playwright/dist folders
- care_hello_fe has vite build --watch in dev script to keep dist/assets/remoteEntry.js fresh
- **No automatic HMR for remoteEntry changes back to main app** - requires manual reload after plugin rebuild
- No mechanism for main app to watch apps/ directly or trigger rebuilds

## Dev-Mode Local Discovery Plan

- Goal: Auto-discover apps/ plugins in dev-only mode for direct HMR without separate builds/previews
- Approach: Detect mode === 'dev', scan apps/ directory for manifest.tsx files, manage two pluginMap paths
- Shared deps already configured: federation shares react, react-dom, react-i18next, @tanstack/react-query, raviger, sonner, decimal.js
- Tailwind content: Already includes ./apps/\*_/_ so CSS should work
- Risk: Re-export cycles if apps/ import from src/ (already happens - care_hello_fe imports Page component)
- Federation globals: **federation** methods already in globals.d.ts and usable in dev mode
- Implementation points: vite.config.mts, care.config.ts (optional), src/PluginEngine.tsx (routing logic)

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
