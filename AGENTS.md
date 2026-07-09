# AGENTS.md

This file is the single source of truth for guidance for AI coding agents (Claude Code, Codex, Cursor, GitHub Copilot, Gemini, etc.) when working with code in this repository.

> **Note:** Tool-specific entry points such as `CLAUDE.md` inherit from this file. Keep all shared guidance here so every agent stays in sync.

## What is CARE?

CARE is a Digital Public Good building an open source EMR + Hospital Management system. This is the React frontend (React 19 + TypeScript + Vite).

## Documentation Map

Detailed guidance is split into focused files so agents only load what's relevant to the task:

- [`docs/local-development.md`](docs/local-development.md) — Backend + frontend setup, local credentials, dev/build/lint commands.
- [`docs/testing.md`](docs/testing.md) — Playwright E2E setup, commands, DB snapshot workflow, and writing tests.
- [`docs/architecture.md`](docs/architecture.md) — Routing, API layer, state management, UI components, plugins, auth, key directories, and config.
- [`docs/care-apps-architecture-note.md`](docs/care-apps-architecture-note.md), [`docs/care-apps-local-dev.md`](docs/care-apps-local-dev.md), [`docs/care-apps-override-architecture.md`](docs/care-apps-override-architecture.md) — Plugin system deep dives.
- [`tests/PLAYWRIGHT_GUIDE.md`](tests/PLAYWRIGHT_GUIDE.md) — Complete Playwright patterns for form interactions, selectors, assertions, and helpers.

## Quick Commands

- `npm run dev` — Start dev server at http://localhost:4000
- `npm run build` — Production build (takes 2+ minutes, set timeout to 180s+)
- `npm run lint` — Run ESLint (takes 85s+, set timeout to 120s+)
- `npm run lint-fix` — ESLint with auto-fix
- `npm run format` — Prettier formatting

See [`docs/local-development.md`](docs/local-development.md) for the full local setup and [`docs/testing.md`](docs/testing.md) for E2E testing.

## Code Style Guidelines

- **TypeScript**: Strict mode, ES2022 target, path aliases (`@/*` → `src/*`, `@careConfig` → `care.config.ts`)
- **Formatting**: Double quotes, 2-space indent, semicolons required
- **Imports**: Order by 3rd-party → library → CAREUI → UI → components → hooks → utils → relative. Prettier plugin auto-sorts on format.
- **Types**: Use `interface` for objects, avoid `any`, prefer maps over enums
- **Naming**: PascalCase for component files (`AuthWizard.tsx`), camelCase for hooks/utils (`useAuth.ts`), kebab-case for directories
- **Components**: Functional components only, named exports preferred, one component per file
- **i18n**: All user-facing strings must use i18next. English translations go in `public/locale/en.json`. Non-English managed via Crowdin — do not edit directly.

Path-specific rules live in [`.github/instructions/`](.github/instructions/) (auto-applied by matching glob).

## Git Workflow

- Branch naming: `issues/{issue#}/{short-name}`
- Default branch: `develop` (staging auto-deploys)
- Pre-commit hooks via husky run Prettier and ESLint on staged files

## Autonomous AI Workflow

When working autonomously on this codebase, follow this sequence:

1. **Before coding:** Read relevant source files and understand existing patterns
2. **After changes:** Run `npm run lint-fix` and `npm run format` on changed files (pre-commit hooks also run these automatically)
3. **Verify:** Run relevant Playwright tests against the local backend to validate changes (see [`docs/testing.md`](docs/testing.md))
4. **For API changes:** Check corresponding backend endpoint in the care backend repo and update both repos if needed
5. **For new features:** Add Playwright tests in `tests/` following [`tests/PLAYWRIGHT_GUIDE.md`](tests/PLAYWRIGHT_GUIDE.md)
6. **For i18n:** Add English strings to `public/locale/en.json`
7. **For writing tests:** Read [`tests/PLAYWRIGHT_GUIDE.md`](tests/PLAYWRIGHT_GUIDE.md) — it contains complete patterns for all form interactions, selectors, assertions, and helpers

### Quick verification cycle

```bash
# 1. Lint & format (or rely on pre-commit hooks)
npm run lint-fix && npm run format

# 2. Type check
npx tsc --noEmit

# 3. Run related tests (requires backend + build)
npx playwright test tests/path/to/related/
```
