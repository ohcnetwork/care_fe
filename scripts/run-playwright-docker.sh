#!/bin/bash

# Script to run Playwright tests using the custom Docker image
# This script handles the setup and teardown of the testing environment

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CARE_BACKEND_PATH="${CARE_BACKEND_PATH:-$PROJECT_ROOT/../care}"
CARE_BACKEND_BRANCH="${CARE_BACKEND_BRANCH:-develop}"
JWKS_FILE="${JWKS_FILE:-$PROJECT_ROOT/.github/runner-files/jwks.b64.txt}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    log_info "Cleaning up..."
    docker compose -f docker-compose.playwright.yml down -v 2>/dev/null || true
}

# Trap cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    cd "$PROJECT_ROOT"
    
    log_info "Starting Playwright E2E Tests with Custom Docker Image"
    log_info "Project root: $PROJECT_ROOT"
    
    # Check if JWKS file exists
    if [ -f "$JWKS_FILE" ]; then
        JWKS_BASE64=$(cat "$JWKS_FILE")
        export JWKS_BASE64
        log_info "JWKS configuration loaded"
    else
        log_warn "JWKS file not found at $JWKS_FILE - some tests may fail"
    fi
    
    # Check if care backend exists locally
    if [ -d "$CARE_BACKEND_PATH" ]; then
        log_info "Using local care backend at: $CARE_BACKEND_PATH"
        export CARE_BACKEND_PATH="$CARE_BACKEND_PATH"
    else
        log_info "Care backend will be cloned from @ohcnetwork/care (branch: $CARE_BACKEND_BRANCH)"
    fi
    
    # Build and run the custom image
    log_info "Building custom Playwright Docker image..."
    docker compose -f docker-compose.playwright.yml build
    
    log_info "Running Playwright tests..."
    docker compose -f docker-compose.playwright.yml up --abort-on-container-exit
    
    # Get exit code
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        log_info "Tests completed successfully!"
    else
        log_error "Tests failed with exit code: $EXIT_CODE"
    fi
    
    return $EXIT_CODE
}

# Run main function
main "$@"
