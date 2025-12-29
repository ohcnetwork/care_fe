# Token Expiration Fix for Playwright Tests

## Problem
Playwright tests were failing due to JWT token expiration during test execution, causing tests to be redirected to the login page with "session expired" errors.

## Solution
Implemented automatic token refresh that works globally without requiring changes to individual test files.

## How It Works

### 1. Token Manager (`tests/utils/tokenManager.ts`)
Utility functions for:
- Checking if tokens are expiring soon (within 5 minutes)
- Refreshing tokens via the API
- Detecting session expiration
- Managing tokens in localStorage

### 2. Global Test Fixture (`tests/fixtures/test.ts`)
Wraps the Playwright `page.goto()` method to:
- Check token expiry after each navigation
- Automatically refresh tokens before they expire
- Work transparently for all tests

### 3. Configuration Updates (`playwright.config.ts`)
Added global timeouts:
- Navigation timeout: 15 seconds
- Action timeout: 10 seconds
- Expect timeout: 10 seconds
- Web server timeout: 120 seconds

## Usage

**No changes required in existing tests!** The solution works automatically.

### Optional: Use Custom Test Import

For new tests or if you want explicit control, you can import from the fixture:

```typescript
import { test, expect } from "../fixtures/test";

test("my test", async ({ page }) => {
  // Token refresh happens automatically
  await page.goto("/");
  // ... rest of test
});
```

### Optional: Manual Token Check

For long-running operations:

```typescript
import { ensureValidToken } from "../utils/tokenManager";

test("long operation", async ({ page }) => {
  await page.goto("/");
  
  // ... long operation ...
  
  // Optionally refresh token manually
  await ensureValidToken(page);
  
  // Continue test
});
```

## What Gets Fixed

✅ **Session timeout errors** - Tokens refresh before expiring  
✅ **Login redirects** - Tests detect and prevent expiration  
✅ **CI flakiness** - Consistent token management  
✅ **Long-running tests** - Automatic refresh during execution  

## Configuration

The token refresh uses environment variables:
- `REACT_CARE_API_URL` - Backend API URL (defaults to `http://localhost:9000`)

Token refresh buffer is 5 minutes by default (configurable in `tokenManager.ts`).

## Troubleshooting

If token refresh fails:
1. Check backend API is accessible
2. Verify `REACT_CARE_API_URL` is correct
3. Check refresh token is still valid
4. Review console logs for refresh errors

## Technical Details

- Tokens are JWT format with `exp` claim
- Refresh happens when < 5 minutes until expiry
- Uses Playwright's `page.request` API
- Updates tokens in browser localStorage
- Works with existing storage state files
