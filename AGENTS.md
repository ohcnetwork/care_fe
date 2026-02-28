# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Lint/Test Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production 
- `npm run lint`: Run ESLint
- `npm run lint-fix`: Run ESLint with auto-fix
- `npm run format`: Format code with Prettier
- `npm run playwright:test`: Run Playwright tests in headless mode
- `npm run playwright:test:ui`: Run Playwright tests in interactive UI mode

## Code Style Guidelines
- **TypeScript**: Strict mode, ES2022 target, path aliases (`@/*` for src)
- **Formatting**: Double quotes, 2-space indent, semicolons required
- **Imports**: Order by 3rd-party → library → CAREUI → UI → components → hooks → utils → relative
- **Types**: Use `interface` for objects, avoid explicit `any`, proper nullability
- **Naming**: PascalCase for components/classes, camelCase for variables/functions
- **Components**: Organized by feature, maintain separation of concerns
- **Error Handling**: Use dedicated error handlers, TypeScript strict null checks

## Cursor Cloud specific instructions

### Architecture
This is a **React 19 + TypeScript + Vite** frontend (port 4000) that connects to a separate **Django backend** ([ohcnetwork/care](https://github.com/ohcnetwork/care)). The backend repo is cloned to `/workspace/care-backend` and runs via Docker Compose (PostgreSQL on 5433, Redis on 6380, MinIO on 9100, Django API on 9000, Celery worker).

### Starting services
1. **Backend**: `cd /workspace/care-backend && sudo dockerd &>/tmp/dockerd.log &` (wait ~3s), then `make up`. If the DB is empty, run `make migrate && make load-fixtures`.
2. **Frontend**: `cd /workspace && npm run dev` (serves on http://localhost:4000). Requires `.env.local` with `REACT_CARE_API_URL=http://localhost:9000`.

### Credentials (seeded by `make load-fixtures`)
- Superuser: `admin` / `admin`
- Staff roles: `care-doctor`, `care-staff`, `care-nurse`, `care-admin`, `care-volunteer`, `care-fac-admin` — all password `Ohcn@123`

### Gotchas
- Docker requires `fuse-overlayfs` storage driver and `iptables-legacy` in this cloud VM. These are configured in `/etc/docker/daemon.json` and via `update-alternatives`.
- The Vite dev server does **not** auto-restart when `.env.local` changes; you must manually restart it.
- `npm run lint` produces ~118 pre-existing errors/warnings (mostly `react/no-unknown-property` in generated files and one `eslint-disable` warning in `supportedBrowsers.ts`). These are not caused by your changes; verify your own files with `npx eslint <file>`.
- The Vite dev server shows TypeScript error overlays from `vite-plugin-checker` for pre-existing type errors. Click "Close" to dismiss them; they don't block functionality.
- Playwright E2E tests require both frontend and backend running. Install browsers first with `npm run playwright:install`.