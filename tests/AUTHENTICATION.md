# Playwright Authentication Helpers

This document describes the authentication helpers and global configuration improvements for Playwright tests in the CARE frontend.

## Overview

The authentication system provides robust session management, automatic re-authentication, and proper error handling for Playwright tests. **These improvements work globally without requiring changes to individual test files.**

## Key Features

- ✅ **Global timeout configuration**: All tests automatically use proper navigation and action timeouts
- ✅ **Automatic retry logic**: Setup files implement exponential backoff for login failures
- ✅ **Session validation in setup**: Authentication setup files ensure clean, valid sessions
- ✅ **Backend connectivity check**: Global setup verifies application accessibility
- ✅ **No test modifications needed**: Works transparently for all existing tests

## Global Configuration (playwright.config.ts)

### Automatic Timeout Handling

All tests automatically benefit from these global timeout settings:

```typescript
use: {
  navigationTimeout: 15000,  // 15s for page navigation
  actionTimeout: 10000,      // 10s for actions (click, fill, etc.)
}

expect: {
  timeout: 10000,            // 10s for assertions
}
```

**No test changes needed** - these apply to all tests automatically.

### Web Server Timeout

Increased web server startup timeout for CI environments:

```typescript
webServer: {
  timeout: 120000,  // 2 minutes for server to be ready
}
```

## Improved Setup Files

### Authentication Setup Files

All authentication setup files now include:

1. **Directory creation**: Automatically creates `.auth` directory
2. **Cleanup**: Removes stale auth files before creating new ones
3. **Retry logic**: Login attempts with exponential backoff (2 retries)
4. **Proper error handling**: Clear error messages for debugging

#### Files Updated:
- `tests/setup/auth.setup.ts` - Admin user
- `tests/setup/nurse.setup.ts` - Nurse user
- `tests/setup/facilityAdmin.setup.ts` - Facility admin user

### Data Setup Files

All data setup files now include:

1. **Session validation**: Verify authentication before proceeding
2. **Explicit timeouts**: All navigation uses explicit timeouts
3. **Better error handling**: Try-catch with informative error messages
4. **Wait conditions**: Explicit waits instead of arbitrary delays

#### Files Updated:
- `tests/setup/facility.setup.ts`
- `tests/setup/patient.setup.ts`
- `tests/setup/patientAccount.setup.ts`

## Authentication Helper Functions

Available in `tests/helper/auth.ts` for optional use:

### `loginWithCredentials(page, username, password, options?)`

Robust login with automatic retry logic:

```typescript
await loginWithCredentials(page, "admin", "admin", {
  timeout: 15000,
  retries: 2,
});
```

**Used automatically in setup files** - no need to call directly in tests.

### `verifyAuthentication(page, options?)`

Verify authentication state:

```typescript
const isAuthenticated = await verifyAuthentication(page);
```

**Optional** - only use if you need to explicitly check authentication in a test.

### `ensureAuthentication(page, username, password)`

Ensure valid session, re-authenticate if needed:

```typescript
await ensureAuthentication(page, "admin", "admin");
```

**Optional** - only use for long-running tests that might experience session expiry.

## Global Setup

The `tests/global.setup.ts` file runs once before all tests to:

1. Verify backend is accessible
2. Check application loads correctly
3. Fail fast if infrastructure issues exist

This prevents wasting time running tests against a non-functional backend.

## What Changed vs. What Didn't

### ✅ Changed (Improved Infrastructure)

- Playwright config: Added global timeouts
- Setup files: Better error handling and retry logic
- Global setup: Backend connectivity verification
- Helper utilities: Reusable authentication functions

### ❌ NOT Changed (No Test Modifications Required)

- Individual test files remain unchanged
- Test assertions work as before
- No need to import new helpers in existing tests
- Existing test patterns continue to work

## Benefits Without Test Changes

All existing tests automatically benefit from:

1. **Better timeout handling**: No more arbitrary waits or missing timeouts
2. **Retry logic**: Transient failures are automatically retried
3. **Session validation**: Setup ensures valid authentication state
4. **Backend checks**: Fast failure if infrastructure is down
5. **Clear error messages**: Better debugging information

## Migration Guide (Optional Improvements)

While **no changes are required**, you can optionally improve specific tests:

### Optional: Add session validation for long-running tests

```typescript
import { ensureAuthentication } from "../helper/auth";

test("very long workflow", async ({ page }) => {
  // Optional: ensure valid session for long-running test
  await ensureAuthentication(page, "admin", "admin");
  
  // Rest of test continues normally...
});
```

### Optional: Add explicit timeout for slow operations

```typescript
// If a specific operation is known to be slow
await page.goto("/slow-page", { timeout: 30000 });
```

But remember: **global defaults (15s navigation, 10s action) apply automatically**.

## Troubleshooting

### Session Timeout Issues

**Root causes now addressed:**

1. ✅ Setup files use retry logic
2. ✅ Global timeouts prevent premature failures
3. ✅ Clean authentication state on each run
4. ✅ Backend connectivity verified before tests

### Setup Failures

If setup tests fail:

1. Check `tests/global.setup.ts` output for backend issues
2. Verify credentials in setup files match backend
3. Check backend logs for authentication errors
4. Ensure network connectivity to backend

### CI/CD Specific Issues

CI configuration includes:

- 2 retries for transient failures
- Sequential execution (1 worker) for stability
- Extended web server timeout (120s)
- Proper backend startup wait

## Summary

**Key Improvement: Zero test modifications required**

All improvements work at the infrastructure level:

- ✅ Global timeout configuration in `playwright.config.ts`
- ✅ Improved setup files with retry logic
- ✅ Global setup for backend verification
- ✅ Helper utilities available for optional use

**Result: More reliable tests without code changes to test files**

### What This Fixes

1. **Session timeout failures**: Retry logic in setup files
2. **Missing timeouts**: Global defaults apply everywhere
3. **Flaky setup**: Clean state and proper error handling
4. **CI failures**: Better infrastructure checks

### What Tests Get Automatically

- Proper navigation timeouts (15s)
- Proper action timeouts (10s)
- Proper assertion timeouts (10s)
- Robust authentication setup
- Backend connectivity verification

**No changes to test code required. All improvements work globally.**

