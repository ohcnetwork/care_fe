#!/bin/bash

# Validation script for Playwright Docker setup
# This script verifies that all components are properly configured

# Don't exit on error immediately - we want to collect all results
# set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Functions
print_header() {
    echo -e "\n${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}Testing:${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}⚠ WARN:${NC} $1"
    ((WARNINGS++))
}

# Main validation
main() {
    print_header "Playwright Docker Setup Validation"
    
    # Test 1: Docker Installation
    print_test "Docker installation"
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_pass "Docker installed: $DOCKER_VERSION"
    else
        print_fail "Docker is not installed"
    fi
    
    # Test 2: Docker Compose
    print_test "Docker Compose installation"
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version)
        print_pass "Docker Compose installed: $COMPOSE_VERSION"
    else
        print_fail "Docker Compose is not installed"
    fi
    
    # Test 3: Docker Daemon
    print_test "Docker daemon status"
    if docker ps &> /dev/null; then
        print_pass "Docker daemon is running"
    else
        print_fail "Docker daemon is not running or not accessible"
    fi
    
    # Test 4: Required Files
    print_test "Required files presence"
    local required_files=(
        "Dockerfile.playwright"
        "docker-compose.playwright.yml"
        "scripts/run-playwright-docker.sh"
        ".dockerignore"
        "PLAYWRIGHT-DOCKER.md"
        "docs/playwright-docker.md"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_pass "File exists: $file"
        else
            print_fail "File missing: $file"
        fi
    done
    
    # Test 5: Script Permissions
    print_test "Script executable permissions"
    if [ -x "scripts/run-playwright-docker.sh" ]; then
        print_pass "Helper script is executable"
    else
        print_warn "Helper script is not executable (run: chmod +x scripts/run-playwright-docker.sh)"
    fi
    
    # Test 6: Docker Compose Config
    print_test "Docker Compose configuration"
    if docker compose -f docker-compose.playwright.yml config --quiet 2>/dev/null; then
        print_pass "Docker Compose configuration is valid"
    else
        print_fail "Docker Compose configuration has errors"
    fi
    
    # Test 7: Dockerfile Syntax (basic check)
    print_test "Dockerfile syntax"
    if [ -f "Dockerfile.playwright" ] && grep -q "FROM" "Dockerfile.playwright"; then
        print_pass "Dockerfile has valid FROM instruction"
    else
        print_fail "Dockerfile appears invalid"
    fi
    
    # Test 8: JWKS File (optional)
    print_test "JWKS configuration file (optional)"
    if [ -f ".github/runner-files/jwks.b64.txt" ]; then
        print_pass "JWKS file exists"
    else
        print_warn "JWKS file not found (some tests may fail without it)"
    fi
    
    # Test 9: Port Availability
    print_test "Port availability"
    if ! lsof -i :4000 &> /dev/null && ! lsof -i :9000 &> /dev/null; then
        print_pass "Ports 4000 and 9000 are available"
    elif lsof -i :4000 &> /dev/null; then
        print_warn "Port 4000 is in use (may cause conflicts)"
    elif lsof -i :9000 &> /dev/null; then
        print_warn "Port 9000 is in use (may cause conflicts)"
    fi
    
    # Test 10: Disk Space
    print_test "Available disk space"
    local available_space=$(df -BG . | awk 'NR==2 {print $4}' | tr -d 'G')
    if [ "$available_space" -ge 5 ]; then
        print_pass "Sufficient disk space available: ${available_space}GB"
    else
        print_warn "Low disk space: ${available_space}GB (recommended: at least 5GB)"
    fi
    
    # Test 11: Network Connectivity
    print_test "GitHub connectivity"
    if curl -s --head https://github.com | head -n 1 | grep "HTTP/2 200" > /dev/null; then
        print_pass "Can connect to GitHub"
    else
        print_warn "Cannot connect to GitHub (may affect backend clone)"
    fi
    
    # Test 12: Container Registry Access
    print_test "GitHub Container Registry access"
    if curl -s --head https://ghcr.io | head -n 1 | grep -E "HTTP/2 (200|301)" > /dev/null; then
        print_pass "Can connect to GitHub Container Registry"
    else
        print_warn "Cannot connect to GHCR (may need authentication)"
    fi
    
    # Summary
    print_header "Validation Summary"
    echo -e "${GREEN}Passed:${NC} $PASSED"
    echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
    echo -e "${RED}Failed:${NC} $FAILED"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All critical tests passed!${NC}"
        echo -e "${GREEN}You can proceed with: ./scripts/run-playwright-docker.sh${NC}"
        return 0
    else
        echo -e "${RED}❌ Some critical tests failed!${NC}"
        echo -e "${RED}Please fix the issues before proceeding.${NC}"
        return 1
    fi
}

# Run main function
main "$@"
