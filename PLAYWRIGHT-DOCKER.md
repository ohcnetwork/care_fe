# Custom Playwright Docker Image

This directory contains files for running Playwright E2E tests with the CARE backend using Docker.

## Quick Reference

| File | Purpose |
|------|---------|
| `Dockerfile.playwright` | Custom Docker image with Playwright, Node.js, and Docker support |
| `docker-compose.playwright.yml` | Orchestrates the testing environment with backend |
| `scripts/run-playwright-docker.sh` | Helper script to run tests locally |
| `docs/playwright-docker.md` | Comprehensive documentation |

## Quick Start

Run tests using the custom Docker image:

```bash
./scripts/run-playwright-docker.sh
```

## What This Provides

✅ **Complete Testing Environment**
- Playwright with Chromium pre-installed
- CARE backend (@ohcnetwork/care) automatically managed
- Frontend pre-built for faster test execution
- Consistent environment for local and CI testing

✅ **Easy to Use**
- Single command to run all tests
- Automatic backend setup and teardown
- No manual configuration needed

✅ **Flexible Configuration**
- Override backend branch
- Use local backend repository
- Custom JWKS configuration

## Environment Variables

Set these before running tests (optional):

```bash
export JWKS_BASE64=$(cat .github/runner-files/jwks.b64.txt)
export CARE_BACKEND_PATH=../care
export CARE_BACKEND_BRANCH=develop
```

## Documentation

For detailed documentation, see [docs/playwright-docker.md](docs/playwright-docker.md).

## Comparison with Standard Workflow

### Standard Approach (Current)
```bash
# Multiple steps required
npm install
npm run build
# Checkout backend separately
# Start backend manually
# Configure environment
npm run playwright:test
```

### Docker Approach (New)
```bash
# Single command
./scripts/run-playwright-docker.sh
```

## Use Cases

### Local Development
- Test changes against the backend
- Debug E2E test failures
- Validate before pushing to CI

### CI/CD
- Faster test execution with pre-built image
- Consistent environment across runs
- Better caching and reliability

## Next Steps

1. Read the [full documentation](docs/playwright-docker.md)
2. Run tests locally: `./scripts/run-playwright-docker.sh`
3. Check GitHub Actions workflow: `.github/workflows/playwright-docker.yaml`

## Support

For issues or questions:
1. Check [docs/playwright-docker.md](docs/playwright-docker.md) for troubleshooting
2. Review existing GitHub issues
3. Create a new issue with details about your problem
