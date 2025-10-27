# Playwright Docker Setup

Custom Docker configuration for running Playwright E2E tests with the CARE backend.

## Quick Start

```bash
./scripts/run-playwright-docker.sh
```

This script:
1. Checks for JWKS configuration (optional)
2. Builds/uses the Docker image with Playwright and frontend pre-built
3. Clones and starts the CARE backend (@ohcnetwork/care)
4. Runs Playwright tests
5. Cleans up resources

## What's Included

- **Dockerfile.playwright**: Custom image with Playwright, Node.js, and Docker CLI
- **docker-compose.playwright.yml**: Orchestrates backend and frontend for testing
- **scripts/run-playwright-docker.sh**: Helper script for local execution
- **scripts/validate-playwright-docker.sh**: Validates Docker setup

## Configuration

Optional environment variables:

```bash
export JWKS_BASE64=$(cat .github/runner-files/jwks.b64.txt)  # Authentication
export CARE_BACKEND_PATH=../care                               # Use local backend
export CARE_BACKEND_BRANCH=develop                             # Backend branch
```

## Manual Docker Commands

```bash
# Build image locally
docker build -f Dockerfile.playwright -t care_fe_playwright .

# Run with docker compose
docker compose -f docker-compose.playwright.yml up --build
```

## Troubleshooting

**Backend fails to start**: Increase `BACKEND_STARTUP_TIMEOUT` or check Docker resources

**Permission errors**: Add user to docker group: `sudo usermod -aG docker $USER`

**Out of memory**: Increase Docker memory limit in Docker Desktop settings

## Architecture

Based on `mcr.microsoft.com/playwright:v1.49.1-noble` with:
- Playwright + Chromium pre-installed
- Docker CLI for backend management
- Frontend pre-built for faster execution
- Full CARE backend integration

## Benefits

- **Local**: Same test environment as CI
- **Fast**: Pre-built frontend, cached dependencies
- **Simple**: One command instead of multiple setup steps
- **Consistent**: Reproducible across machines and CI
