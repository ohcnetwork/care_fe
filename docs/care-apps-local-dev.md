## Plugin Discovery & Setup

- Build-time plugins configured via REACT_ENABLED_APPS env var, parsed by scripts/setup-care-apps.ts
- setup-care-apps.ts generates src/pluginMap.ts with static imports of app manifests
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
- Implementation points: scripts/setup-care-apps.ts, vite.config.mts, care.config.ts (optional), src/PluginEngine.tsx (routing logic)
