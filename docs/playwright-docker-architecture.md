# Playwright Docker Image Architecture

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Custom Playwright Docker Image                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Base Layer: mcr.microsoft.com/playwright:v1.49.1       │   │
│  │  - Ubuntu Noble                                          │   │
│  │  - Playwright + Chromium                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Docker Layer                                            │   │
│  │  - Docker CLI                                            │   │
│  │  - Docker Compose Plugin                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Application Layer                                       │   │
│  │  - Node.js dependencies (npm ci)                         │   │
│  │  - CARE frontend source code                             │   │
│  │  - Pre-built production bundle                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Runtime Configuration                                   │   │
│  │  - Environment variables                                 │   │
│  │  - Port mappings (4000, 9000)                            │   │
│  │  - Volume mounts for test results                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Execution Flow

```
┌──────────────┐
│  Start Test  │
└──────┬───────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Check for CARE Backend              │
│ - Use local if available            │
│ - Clone from @ohcnetwork/care       │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Configure Backend Environment       │
│ - Set JWKS_BASE64                   │
│ - Disable rate limiting             │
│ - Set questionnaire size limit      │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Start Backend Services              │
│ - PostgreSQL                        │
│ - Redis                             │
│ - Django backend                    │
│ - Load fixtures                     │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Wait for Backend Health Check       │
│ - Poll http://localhost:9000/...    │
│ - Timeout: 120 seconds              │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Start Frontend Preview Server       │
│ - Use pre-built production bundle   │
│ - Listen on http://localhost:4000   │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Run Playwright Tests                │
│ - Execute test suite                │
│ - Generate reports                  │
│ - Save artifacts                    │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Cleanup                             │
│ - Stop frontend server              │
│ - Stop backend containers           │
│ - Preserve test results             │
└──────┬──────────────────────────────┘
       │
       ↓
┌──────────────┐
│  Exit        │
└──────────────┘
```

## Component Interaction

```
┌────────────────┐         ┌────────────────┐         ┌────────────────┐
│   Playwright   │ ───────→│    Frontend    │ ───────→│    Backend     │
│   Test Runner  │  HTTP   │    Preview     │  API    │    Services    │
│                │         │   localhost:   │         │   localhost:   │
│                │         │      4000      │         │      9000      │
└────────────────┘         └────────────────┘         └────────────────┘
        │                          │                          │
        │                          │                          ↓
        │                          │                  ┌────────────────┐
        │                          │                  │   PostgreSQL   │
        │                          │                  │      DB        │
        │                          │                  └────────────────┘
        │                          │                          ↓
        │                          │                  ┌────────────────┐
        │                          │                  │     Redis      │
        │                          │                  │     Cache      │
        │                          │                  └────────────────┘
        ↓                          ↓
┌────────────────────────────────────────┐
│         Test Results & Reports         │
│   - playwright-report/                 │
│   - test-results/                      │
│   - test-results.json                  │
└────────────────────────────────────────┘
```

## Network Configuration

```
Host Network Mode (network_mode: "host")
┌─────────────────────────────────────────────────────┐
│                    Docker Host                       │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │           Playwright Container               │   │
│  │  ┌────────────────────────────────────┐     │   │
│  │  │  Frontend (port 4000)              │     │   │
│  │  └────────────────────────────────────┘     │   │
│  │  ┌────────────────────────────────────┐     │   │
│  │  │  Backend (port 9000)               │     │   │
│  │  │  via docker-compose                │     │   │
│  │  └────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Direct access to localhost:4000 and localhost:9000 │
└─────────────────────────────────────────────────────┘
```

## Volume Mounts

```
Host Machine                     Container
──────────────                   ─────────

./playwright-report/      →      /workspace/care_fe/playwright-report/
./test-results/           →      /workspace/care_fe/test-results/
/var/run/docker.sock      →      /var/run/docker.sock (Docker-in-Docker)
${CARE_BACKEND_PATH}      →      /workspace/care/ (optional)
```

## Build Process

```
Step 1: Base Image
  ↓ FROM mcr.microsoft.com/playwright:v1.49.1-noble

Step 2: Install System Dependencies
  ↓ apt-get install git make curl docker-ce-cli docker-compose-plugin

Step 3: Install Node.js Dependencies
  ↓ npm ci --prefer-offline --ignore-scripts

Step 4: Copy Application
  ↓ COPY . .

Step 5: Post-Install Scripts
  ↓ npm run postinstall && npm run setup

Step 6: Build Frontend
  ↓ npm run build
  
Step 7: Configure Runtime
  ↓ Set ENV vars, expose ports, define CMD
```

## Caching Strategy

```
Layer 1: Base Playwright Image (cached by Docker Hub)
   ↓
Layer 2: System Dependencies (cached if Dockerfile unchanged)
   ↓
Layer 3: package.json + package-lock.json (cache busted on dependency changes)
   ↓
Layer 4: Node modules (cached if package files unchanged)
   ↓
Layer 5: Application code (cache busted on code changes)
   ↓
Layer 6: Built application (cache busted on code or dependency changes)
```

## CI/CD Integration

```
GitHub Actions Workflow
┌────────────────────────────────────┐
│  Build Stage                       │
│  - Build Docker image              │
│  - Push to GHCR                    │
│  - Tag with SHA + branch           │
└────────┬───────────────────────────┘
         │
         ↓
┌────────────────────────────────────┐
│  Test Stage (Matrix: 3 shards)     │
│  - Pull pre-built image            │
│  - Checkout backend                │
│  - Start backend services          │
│  - Run tests in shard              │
│  - Upload artifacts                │
└────────┬───────────────────────────┘
         │
         ↓
┌────────────────────────────────────┐
│  Report Stage                      │
│  - Download all artifacts          │
│  - Merge results                   │
│  - Generate summary                │
└────────────────────────────────────┘
```
