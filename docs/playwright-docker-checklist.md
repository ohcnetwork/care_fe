# Playwright Docker Setup - Complete Checklist

This checklist helps ensure your custom Playwright Docker setup is complete and working correctly.

## ✅ Pre-requisites

- [ ] Docker installed (version 20.10 or higher)
- [ ] Docker Compose installed (v2.0 or higher)
- [ ] Git installed
- [ ] Access to GitHub Container Registry (for pulling pre-built images)
- [ ] CARE backend available locally or network access to clone it

## ✅ Files Present

Core files that should exist:

- [ ] `Dockerfile.playwright` - Custom Docker image definition
- [ ] `docker-compose.playwright.yml` - Docker Compose configuration
- [ ] `scripts/run-playwright-docker.sh` - Helper script (executable)
- [ ] `.dockerignore` - Optimized for Playwright builds
- [ ] `PLAYWRIGHT-DOCKER.md` - Quick reference guide

Documentation files:

- [ ] `docs/playwright-docker.md` - Comprehensive documentation
- [ ] `docs/playwright-docker-architecture.md` - Architecture diagrams
- [ ] `docs/playwright-docker-examples.md` - Usage examples
- [ ] `README.md` - Updated with Docker testing section

GitHub Actions workflows (optional):

- [ ] `.github/workflows/playwright-docker.yaml` - Alternative test workflow
- [ ] `.github/workflows/build-playwright-image.yaml` - Image build workflow

## ✅ Configuration Validation

### Docker Setup

```bash
# Verify Docker installation
docker --version
# Expected: Docker version 20.10.0 or higher

# Verify Docker Compose
docker compose version
# Expected: Docker Compose version v2.0.0 or higher

# Verify Docker daemon is running
docker ps
# Expected: List of running containers (may be empty)
```

### File Permissions

```bash
# Verify script is executable
ls -l scripts/run-playwright-docker.sh
# Expected: -rwxr-xr-x (executable permissions)

# If not executable:
chmod +x scripts/run-playwright-docker.sh
```

### Docker Compose Syntax

```bash
# Validate docker-compose configuration
docker compose -f docker-compose.playwright.yml config --quiet
# Expected: No output (silence means success)
```

## ✅ Build Validation

### Local Image Build

```bash
# Build the Docker image
docker build -f Dockerfile.playwright -t care_fe_playwright_test .
# Expected: Successful build with no errors

# Verify image was created
docker images | grep care_fe_playwright_test
# Expected: Image listed with tag
```

### Pull Pre-built Image

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/ohcnetwork/care_fe/playwright:latest
# Expected: Image downloaded successfully

# Verify pulled image
docker images | grep playwright
# Expected: Image listed
```

## ✅ Environment Setup

### JWKS Configuration (Optional)

```bash
# Check if JWKS file exists
ls -l .github/runner-files/jwks.b64.txt
# Expected: File exists

# Set environment variable
export JWKS_BASE64=$(cat .github/runner-files/jwks.b64.txt)
echo "JWKS configured: ${JWKS_BASE64:0:20}..."
# Expected: Shows first 20 characters of JWKS
```

### Backend Configuration

```bash
# Check if backend is available locally
ls -ld ../care
# Expected: Directory exists (optional)

# Or set backend branch
export CARE_BACKEND_BRANCH=develop
echo "Backend branch: $CARE_BACKEND_BRANCH"
# Expected: Shows configured branch
```

## ✅ Functionality Tests

### Test 1: Helper Script Execution

```bash
# Run the helper script (dry run - will fail but should start)
./scripts/run-playwright-docker.sh
# Expected: Script starts, may fail on actual tests but infrastructure should work
```

### Test 2: Docker Compose Execution

```bash
# Start services (may need to interrupt with Ctrl+C)
docker compose -f docker-compose.playwright.yml up
# Expected: Container starts, pulls/builds images, begins test setup
```

### Test 3: Interactive Shell

```bash
# Get shell in container
docker run -it --rm \
  --entrypoint /bin/bash \
  ghcr.io/ohcnetwork/care_fe/playwright:latest

# Inside container, verify installations
node --version
npm --version
npx playwright --version
docker --version
# Expected: All commands work and show version numbers

# Exit container
exit
```

### Test 4: Network Connectivity

```bash
# Test with host network
docker run --rm \
  --network host \
  --entrypoint /bin/bash \
  ghcr.io/ohcnetwork/care_fe/playwright:latest \
  -c "curl -I http://localhost:4000 || echo 'Frontend not running (expected)'"
# Expected: Connection attempt (may fail if frontend not running)
```

## ✅ Common Issues Checklist

### Docker Issues

- [ ] Docker daemon is running
- [ ] User has permissions to run Docker (in `docker` group)
- [ ] Sufficient disk space for images (at least 5GB free)
- [ ] No conflicting containers using ports 4000 or 9000

### Permission Issues

```bash
# Check Docker socket permissions
ls -l /var/run/docker.sock
# Expected: Socket is accessible

# Add user to docker group if needed
sudo usermod -aG docker $USER
# Then log out and back in
```

### Network Issues

- [ ] Can access GitHub Container Registry
- [ ] Can clone from github.com/ohcnetwork/care
- [ ] No firewall blocking Docker networking
- [ ] Ports 4000 and 9000 are available

### Build Issues

- [ ] Sufficient memory for build (at least 4GB recommended)
- [ ] No proxy issues blocking package downloads
- [ ] npm cache is not corrupted
- [ ] Docker build cache is not corrupted

## ✅ Documentation Review

### User Documentation

- [ ] README.md includes Docker testing section
- [ ] Quick start guide is clear and concise
- [ ] Prerequisites are listed
- [ ] Common issues are documented

### Technical Documentation

- [ ] Architecture is documented
- [ ] Environment variables are explained
- [ ] Network configuration is clear
- [ ] Volume mounts are documented

### Examples

- [ ] Basic usage example works
- [ ] Advanced usage examples are provided
- [ ] CI/CD integration examples are included
- [ ] Troubleshooting examples help debug issues

## ✅ CI/CD Integration

### GitHub Actions

- [ ] Workflow files are syntactically correct
- [ ] Secrets are properly configured (if needed)
- [ ] Permissions are set correctly
- [ ] Caching is configured for efficiency

### Image Registry

- [ ] Image is pushed to GHCR on develop/main branches
- [ ] Image tags are meaningful (SHA, branch, latest)
- [ ] Image is accessible to workflows
- [ ] Security scanning is configured

## ✅ Security Considerations

- [ ] Base image is from trusted source (Microsoft Playwright)
- [ ] Dockerfile doesn't include secrets
- [ ] JWKS is passed via environment, not baked in
- [ ] Vulnerability scanning is enabled
- [ ] Image is updated regularly

## ✅ Maintenance

- [ ] Playwright version is documented
- [ ] Node.js version is documented
- [ ] Update procedure is documented
- [ ] Rollback procedure is documented

## 🎯 Final Validation

Run this comprehensive test to ensure everything works:

```bash
#!/bin/bash

echo "Starting comprehensive validation..."

# 1. Check Docker
echo "1. Checking Docker..."
docker --version || exit 1
docker compose version || exit 1

# 2. Check files
echo "2. Checking files..."
test -f Dockerfile.playwright || exit 1
test -f docker-compose.playwright.yml || exit 1
test -x scripts/run-playwright-docker.sh || exit 1

# 3. Validate config
echo "3. Validating configuration..."
docker compose -f docker-compose.playwright.yml config --quiet || exit 1

# 4. Pull/build image
echo "4. Building image..."
docker build -f Dockerfile.playwright -t care_fe_playwright_test . || exit 1

# 5. Test container
echo "5. Testing container..."
docker run --rm \
  --entrypoint /bin/bash \
  care_fe_playwright_test \
  -c "node --version && npm --version && npx playwright --version" || exit 1

echo "✅ All validations passed!"
echo "Ready to run: ./scripts/run-playwright-docker.sh"
```

Save this as `scripts/validate-playwright-docker.sh`, make it executable, and run it:

```bash
chmod +x scripts/validate-playwright-docker.sh
./scripts/validate-playwright-docker.sh
```

## ✅ Next Steps

After completing this checklist:

1. [ ] Run a test execution: `./scripts/run-playwright-docker.sh`
2. [ ] Review test results in `playwright-report/`
3. [ ] Update CI/CD workflows if needed
4. [ ] Share documentation with team
5. [ ] Monitor first few CI runs for issues

## 📊 Success Criteria

You can consider the setup successful when:

- ✅ Helper script runs without errors
- ✅ Tests execute and produce results
- ✅ Test reports are generated
- ✅ CI/CD workflow uses the custom image
- ✅ Team members can run tests locally
- ✅ Documentation is clear and helpful

## 🆘 Getting Help

If you encounter issues:

1. Check [docs/playwright-docker.md](docs/playwright-docker.md) troubleshooting section
2. Review [docs/playwright-docker-examples.md](docs/playwright-docker-examples.md) for examples
3. Examine Docker logs: `docker logs <container_id>`
4. Try the interactive shell for debugging
5. Create an issue with:
   - Docker version
   - Error messages
   - Steps to reproduce
   - Environment details

---

**Note**: This checklist is comprehensive. Not all items are required for basic functionality, but completing all ensures a robust, production-ready setup.
