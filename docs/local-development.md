# Local Development Environment

Setup guidance for running the CARE frontend against a local backend. See [`AGENTS.md`](../AGENTS.md) for the top-level agent guidance that links here.

## Backend Setup (care)

Clone the [care backend](https://github.com/ohcnetwork/care) alongside this repo and create a Python 3.13 venv with dependencies installed.

**Start backend services:**

```bash
# Ensure PostgreSQL and Redis are running
pg_isready || sudo pg_ctlcluster 16 main start
redis-cli ping || redis-server --daemonize yes

# Start Django backend on port 9000 (from the care backend directory)
cd <care-backend-dir>
DJANGO_SETTINGS_MODULE=config.settings.local DJANGO_READ_DOT_ENV_FILE=true .venv/bin/python manage.py runserver 0.0.0.0:9000
```

**Database commands:**

```bash
cd <care-backend-dir>
.venv/bin/python manage.py migrate                    # Run migrations
.venv/bin/python manage.py load_fixtures              # Load test data
```

**Backend fixture credentials (local fixture data only — do not use on deployed instances):**

| Role           | Username         | Password   |
| -------------- | ---------------- | ---------- |
| Doctor         | `care-doctor`    | `Ohcn@123` |
| Admin          | `care-admin`     | `Ohcn@123` |
| Nurse          | `care-nurse`     | `Ohcn@123` |
| Staff          | `care-staff`     | `Ohcn@123` |
| Volunteer      | `care-volunteer` | `Ohcn@123` |
| Facility Admin | `care-fac-admin` | `Ohcn@123` |

**Managing organization users** (Health Department):

| Role    | Username            | Password   |
| ------- | ------------------- | ---------- |
| Admin   | `care-role-admin`   | `Ohcn@123` |
| Manager | `care-role-manager` | `Ohcn@123` |
| Member  | `care-role-member`  | `Ohcn@123` |

## Frontend Setup

The frontend is configured via `.env.local` to use the local backend:

```
REACT_CARE_API_URL=http://127.0.0.1:9000
```

## Build/Lint Commands

- `npm run dev` — Start dev server at http://localhost:4000
- `npm run build` — Production build (takes 2+ minutes, set timeout to 180s+)
- `npm run lint` — Run ESLint (takes 85s+, set timeout to 120s+)
- `npm run lint-fix` — ESLint with auto-fix
- `npm run format` — Prettier formatting

For E2E testing, see [`testing.md`](./testing.md).
