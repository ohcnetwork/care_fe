# Playwright Docker Image - Usage Examples

This document provides practical examples of using the custom Playwright Docker image in different scenarios.

## Table of Contents

- [Local Development](#local-development)
- [CI/CD Integration](#cicd-integration)
- [Custom Configurations](#custom-configurations)
- [Debugging](#debugging)
- [Advanced Usage](#advanced-usage)

## Local Development

### Example 1: Quick Test Run

Run tests with default settings using the helper script:

```bash
./scripts/run-playwright-docker.sh
```

### Example 2: Using Pre-built Image

Skip building and use the pre-built image from GHCR:

```bash
# Pull the latest image
docker pull ghcr.io/ohcnetwork/care_fe/playwright:latest

# Run tests
docker run --rm \
  --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd)/playwright-report:/workspace/care_fe/playwright-report \
  -v $(pwd)/test-results:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest
```

### Example 3: With Local Backend

If you have the care backend already cloned locally:

```bash
export CARE_BACKEND_PATH=/path/to/your/care
docker compose -f docker-compose.playwright.yml up
```

### Example 4: Testing Specific Branch

Test against a specific backend branch:

```bash
export CARE_BACKEND_BRANCH=feature/new-api
./scripts/run-playwright-docker.sh
```

## CI/CD Integration

### Example 5: GitHub Actions with Pre-built Image

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Playwright Tests
        run: |
          docker pull ghcr.io/ohcnetwork/care_fe/playwright:latest
          docker run --rm \
            --network host \
            -v $(pwd)/test-results:/workspace/care_fe/test-results \
            ghcr.io/ohcnetwork/care_fe/playwright:latest
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
```

### Example 6: GitLab CI

```yaml
test:e2e:
  image: ghcr.io/ohcnetwork/care_fe/playwright:latest
  script:
    - cd /workspace/care_fe
    - npx playwright test
  artifacts:
    paths:
      - playwright-report/
      - test-results/
    expire_in: 7 days
```

### Example 7: Jenkins Pipeline

```groovy
pipeline {
    agent {
        docker {
            image 'ghcr.io/ohcnetwork/care_fe/playwright:latest'
        }
    }
    stages {
        stage('Test') {
            steps {
                sh 'npx playwright test'
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'test-results/**/*'
            publishHTML([
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Report'
            ])
        }
    }
}
```

## Custom Configurations

### Example 8: With Custom JWKS

```bash
# Set JWKS from file
export JWKS_BASE64=$(cat .github/runner-files/jwks.b64.txt)

# Run tests
./scripts/run-playwright-docker.sh
```

### Example 9: With Environment Variables

```bash
docker run --rm \
  --network host \
  -e REACT_CARE_API_URL=http://localhost:9000 \
  -e CI=true \
  -e BACKEND_STARTUP_TIMEOUT=180 \
  -v $(pwd)/test-results:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest
```

### Example 10: Run Specific Test Suite

```bash
docker run --rm \
  --network host \
  -v $(pwd)/test-results:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright test tests/auth/login.spec.ts
```

### Example 11: Run Tests with UI Mode

```bash
docker run --rm \
  --network host \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v $(pwd)/test-results:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright test --ui
```

## Debugging

### Example 12: Interactive Shell

Get an interactive shell in the container for debugging:

```bash
docker run -it --rm \
  --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --entrypoint /bin/bash \
  ghcr.io/ohcnetwork/care_fe/playwright:latest
```

### Example 13: Run with Debug Mode

```bash
docker run --rm \
  --network host \
  -e DEBUG=pw:api \
  -e PWDEBUG=1 \
  -v $(pwd)/test-results:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright test --headed --debug
```

### Example 14: Generate Trace

```bash
docker run --rm \
  --network host \
  -v $(pwd)/test-results:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright test --trace on
```

View the trace:

```bash
npx playwright show-trace test-results/trace.zip
```

### Example 15: View Test Report

```bash
# After running tests
docker run --rm \
  -v $(pwd)/playwright-report:/workspace/care_fe/playwright-report \
  -p 9323:9323 \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright show-report --port 9323 --host 0.0.0.0
```

## Advanced Usage

### Example 16: Parallel Sharding

Run tests in parallel across multiple containers:

```bash
# Terminal 1 - Shard 1/3
docker run --rm \
  --network host \
  -v $(pwd)/test-results-1:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright test --shard=1/3

# Terminal 2 - Shard 2/3
docker run --rm \
  --network host \
  -v $(pwd)/test-results-2:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright test --shard=2/3

# Terminal 3 - Shard 3/3
docker run --rm \
  --network host \
  -v $(pwd)/test-results-3:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright test --shard=3/3
```

### Example 17: With Custom Playwright Config

```bash
# Mount custom config
docker run --rm \
  --network host \
  -v $(pwd)/playwright.custom.config.ts:/workspace/care_fe/playwright.config.ts \
  -v $(pwd)/test-results:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright test
```

### Example 18: Continuous Testing

Watch mode for continuous testing during development:

```bash
docker run --rm \
  --network host \
  -v $(pwd)/tests:/workspace/care_fe/tests \
  -v $(pwd)/test-results:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright test --watch
```

### Example 19: Generate Test Code

Use Playwright's codegen feature:

```bash
docker run -it --rm \
  --network host \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v $(pwd)/tests:/workspace/care_fe/tests \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright codegen http://localhost:4000
```

### Example 20: Custom Network Configuration

Run with a custom Docker network:

```bash
# Create network
docker network create care-test-network

# Run backend on custom network
docker run -d \
  --name care-backend \
  --network care-test-network \
  -p 9000:9000 \
  ghcr.io/ohcnetwork/care:develop

# Run tests
docker run --rm \
  --network care-test-network \
  -e REACT_CARE_API_URL=http://care-backend:9000 \
  -v $(pwd)/test-results:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest

# Cleanup
docker stop care-backend
docker network rm care-test-network
```

## Combining Examples

### Example 21: Full Local Development Setup

```bash
#!/bin/bash
# Complete local testing setup with all bells and whistles

# Configuration
export CARE_BACKEND_PATH=../care
export CARE_BACKEND_BRANCH=develop
export JWKS_BASE64=$(cat .github/runner-files/jwks.b64.txt)
export BACKEND_STARTUP_TIMEOUT=180

# Pull latest image
docker pull ghcr.io/ohcnetwork/care_fe/playwright:latest

# Run tests with full configuration
docker compose -f docker-compose.playwright.yml up --abort-on-container-exit

# View results
npx playwright show-report playwright-report

# Cleanup
docker compose -f docker-compose.playwright.yml down -v
```

## Tips and Best Practices

1. **Volume Mounts**: Always mount test results to persist them after container exit
2. **Network Mode**: Use `--network host` for simplest local testing
3. **Resource Limits**: Set memory limits for CI: `--memory=4g --memory-swap=4g`
4. **Caching**: Use Docker layer caching in CI for faster builds
5. **Cleanup**: Always clean up containers and volumes after tests
6. **Logs**: Use `docker logs` to debug container issues
7. **Updates**: Regularly pull latest image for security and feature updates

## Troubleshooting Examples

### Example 22: Check Container Health

```bash
# Run with health check
docker run --rm \
  --network host \
  --health-cmd="curl -f http://localhost:9000/api/v1/health/ || exit 1" \
  --health-interval=10s \
  --health-timeout=5s \
  --health-retries=5 \
  ghcr.io/ohcnetwork/care_fe/playwright:latest
```

### Example 23: Debug Network Issues

```bash
# Check connectivity from inside container
docker run -it --rm \
  --network host \
  --entrypoint /bin/bash \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  -c "curl -v http://localhost:9000/api/v1/health/"
```

### Example 24: Increase Verbosity

```bash
docker run --rm \
  --network host \
  -e DEBUG=* \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  -v $(pwd)/test-results:/workspace/care_fe/test-results \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  npx playwright test --reporter=list
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [CARE Documentation](https://docs.ohc.network/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
