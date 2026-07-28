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

This is the CARE frontend (`care_fe`, React 19 + Vite). Standard commands live in `CLAUDE.md` and `package.json` scripts — refer to those; notes below only cover non-obvious environment caveats.

### Node version
- `.node-version` pins **Node 24**, but the base image's `/exec-daemon/node` is **v22** and shadows nvm in `PATH`. Login shells (e.g. new `tmux` sessions) already get Node 24 via a line appended to `~/.bashrc`. If a non-login/non-interactive shell reports v22, prepend it manually: `export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"`. The startup update script only runs `npm install`; Node 22 handles that fine.

### Frontend
- `npm run dev` serves on **http://localhost:4000**. `.env.local` sets `REACT_CARE_API_URL=http://127.0.0.1:9000` so the app talks to the local backend. `.env.local` is gitignored; it persists in the VM snapshot but recreate it with that single line if missing. Without it, the committed `.env` points to the hosted `https://careapi.ohc.network` (which does NOT have the fixture accounts, so local login fails).

### Local backend (required for login / full E2E)
- The separate `ohcnetwork/care` Django backend is checked out at **`~/care`** (pipenv venv at `~/care/.venv`, Python 3.13) with the DB migrated + fixtures loaded. Login credentials are in `CLAUDE.md`.
- PostgreSQL 16 and Redis are installed but NOT started by systemd — start them each boot:
  `sudo pg_ctlcluster 16 main start` and `sudo redis-server --daemonize yes`.
- Start the API on port 9000 from `~/care`:
  `DJANGO_SETTINGS_MODULE=config.settings.local DJANGO_READ_DOT_ENV_FILE=true .venv/bin/python manage.py runserver 0.0.0.0:9000`
  (backend `~/care/.env` points `DATABASE_URL` at `localhost:5432/care` and `REDIS_URL` at `localhost:6379`).
- Refresh backend deps only when the backend repo changes: `cd ~/care && PATH="$HOME/.local/bin:$PATH" PIPENV_VENV_IN_PROJECT=1 pipenv sync --dev`.

### Playwright
- Requires the backend on 9000. Set `CARE_BACKEND_DIR=~/care` for the `playwright:db-*` scripts (snapshot at `/tmp/care_playwright_snapshot.dump`); `globalSetup` auto-restores it locally. Per `CLAUDE.md`, tests are meant to run against the production build (`npm run build` + `npm run preview`); `reuseExistingServer` will reuse whatever is on port 4000, and running against the `npm run dev` server can be flaky under parallel workers.