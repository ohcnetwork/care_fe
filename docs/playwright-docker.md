# Custom Playwright Docker Image

This directory contains the configuration for a custom Docker image designed to run Playwright E2E tests with the CARE backend integration.

## Overview

The custom Playwright Docker image provides:

- **Playwright** with Chromium browser pre-installed
- **Node.js 22** for running the CARE frontend
- **Docker CLI and Compose** for managing backend services
- **Pre-built frontend** to speed up test execution
- **All dependencies** needed to run both frontend and backend

## Files

- `Dockerfile.playwright` - Custom Docker image definition
- `docker-compose.playwright.yml` - Docker Compose configuration for running tests
- `scripts/run-playwright-docker.sh` - Helper script to run tests locally

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git (for cloning the care backend if not available locally)
- Optional: Care backend repository cloned at `../care`

### Running Tests Locally

```bash
# Using the helper script (recommended)
./scripts/run-playwright-docker.sh

# Or using docker-compose directly
docker-compose -f docker-compose.playwright.yml up --build
```

### Environment Variables

- `JWKS_BASE64` - JWKS configuration for backend authentication (required for some tests)
- `CARE_BACKEND_PATH` - Path to care backend repository (default: `../care`)
- `CARE_BACKEND_BRANCH` - Branch to clone if backend not available locally (default: `develop`)
- `BACKEND_STARTUP_TIMEOUT` - Timeout for backend startup in seconds (default: `120`)

### Example with Custom Configuration

```bash
# Set environment variables
export JWKS_BASE64=$(cat .github/runner-files/jwks.b64.txt)
export CARE_BACKEND_PATH=/path/to/care
export CARE_BACKEND_BRANCH=develop

# Run tests
./scripts/run-playwright-docker.sh
```

## GitHub Actions Integration

The custom Docker image can be used in GitHub Actions workflows to:

1. **Reduce CI time** - Pre-built dependencies and frontend
2. **Improve reliability** - Consistent testing environment
3. **Simplify workflows** - Single image contains all requirements

### Example Workflow Usage

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/ohcnetwork/care_fe_playwright:latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Run tests
        run: npx playwright test
        env:
          REACT_CARE_API_URL: http://localhost:9000
```

## Building the Image

### Local Build

```bash
docker build -f Dockerfile.playwright -t care_fe_playwright .
```

### Multi-platform Build (for CI/CD)

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.playwright \
  -t ghcr.io/ohcnetwork/care_fe_playwright:latest \
  --push \
  .
```

## Architecture

The custom image is based on `mcr.microsoft.com/playwright:v1.49.1-noble` and includes:

1. **Base Layer**: Microsoft Playwright image with Ubuntu Noble
2. **Docker Layer**: Docker CLI and Docker Compose for backend management
3. **Node.js Layer**: Dependencies and build tooling
4. **Application Layer**: Frontend application with pre-built production build
5. **Runtime Layer**: Environment configuration and test runner

## How It Works

### Local Development

1. The helper script checks for JWKS configuration
2. Builds the custom Docker image with the frontend
3. Starts a container with Docker socket access
4. Container clones/uses the care backend repository
5. Starts backend services using docker-compose
6. Starts frontend preview server
7. Runs Playwright tests
8. Cleans up all resources

### CI/CD Pipeline

1. Pre-built image is pulled from registry
2. Backend is checked out and started
3. Tests are executed using the pre-built frontend
4. Results are collected and reported
5. Resources are cleaned up

## Advantages

### Over Current Setup

- **Faster CI runs**: No need to install Playwright browsers on each run
- **Better caching**: Frontend build is cached in the image
- **Consistency**: Same environment across all test runs
- **Isolation**: Tests run in isolated containers
- **Reusability**: Same image can be used locally and in CI

### Development Experience

- **Easy local testing**: Run the same tests as CI locally
- **Debugging**: Access to full Docker environment for troubleshooting
- **Flexibility**: Override backend branch or location as needed

## Troubleshooting

### Tests fail to start backend

**Issue**: Backend services fail to start within timeout

**Solution**: 
- Increase `BACKEND_STARTUP_TIMEOUT` environment variable
- Check Docker resources (memory, CPU)
- Verify network connectivity for pulling backend image

### Cannot access Docker socket

**Issue**: Permission denied when accessing `/var/run/docker.sock`

**Solution**:
- Ensure your user is in the `docker` group: `sudo usermod -aG docker $USER`
- Log out and back in for group changes to take effect
- Run with appropriate permissions

### JWKS authentication errors

**Issue**: Backend authentication fails in tests

**Solution**:
- Ensure `JWKS_BASE64` environment variable is set
- Verify the JWKS file content is valid
- Check that backend is configured with the same JWKS

### Out of memory errors

**Issue**: Frontend build or tests fail with OOM errors

**Solution**:
- Increase Docker memory limit in Docker Desktop settings
- The image is configured with `NODE_OPTIONS="--max-old-space-size=4096"`
- Consider reducing parallel test execution

## Maintenance

### Updating Playwright Version

Edit `Dockerfile.playwright` and change the base image version:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.XX.X-noble
```

### Updating Node.js Version

The Playwright image comes with a specific Node.js version. If you need a different version, you'll need to install it explicitly in the Dockerfile.

### Updating Dependencies

Dependencies are installed from `package.json` during image build. To update:

1. Update `package.json` and `package-lock.json`
2. Rebuild the image
3. Test thoroughly before pushing to registry

## Contributing

When modifying the Docker configuration:

1. Test locally using the helper script
2. Verify CI workflow compatibility
3. Update documentation as needed
4. Ensure backward compatibility where possible

## License

MIT License - Same as the CARE project
