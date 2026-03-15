import { FullConfig } from "@playwright/test";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Token name constants
const ACCESS_TOKEN_KEY = "care_access_token";
const REFRESH_TOKEN_KEY = "care_refresh_token";

/**
 * Interface for localStorage items in Playwright storage state
 */
interface LocalStorageItem {
  name: string;
  value: string;
}

/**
 * Restore database from snapshot before tests run.
 * Ensures a clean, repeatable state for every test execution.
 * Skipped on CI (CI uses fresh Docker containers per run).
 */
function restoreDatabase() {
  if (process.env.CI) return;

  const snapshotFile =
    process.env.PLAYWRIGHT_DB_SNAPSHOT || "/tmp/care_playwright_snapshot.dump";
  const scriptPath = path.resolve(__dirname, "../scripts/playwright-db.sh");

  if (!fs.existsSync(snapshotFile)) {
    console.log(
      "⚠️ No DB snapshot found. Run 'npm run playwright:db-reset' to create one.",
    );
    return;
  }

  if (!fs.existsSync(scriptPath)) {
    console.log("⚠️ playwright-db.sh not found, skipping DB restore");
    return;
  }

  try {
    console.log("🔄 Restoring database from snapshot...");
    const output = execFileSync("bash", [scriptPath, "restore"], {
      stdio: "pipe",
      timeout: 30000,
      encoding: "utf-8",
    });
    if (output) console.log(output.trim());
    console.log("✅ Database restored to clean state");
  } catch (error) {
    const stderr =
      error instanceof Error && "stderr" in error
        ? (error as { stderr: string }).stderr
        : "";
    console.error(
      "⚠️ DB restore failed (tests will continue):",
      stderr || (error instanceof Error ? error.message : error),
    );
  }
}

/**
 * Refresh authentication tokens using native fetch.
 */
async function refreshTokens() {
  const authFile = path.join(__dirname, ".auth/user.json");

  if (!fs.existsSync(authFile)) {
    console.log("⚠️ Auth file not found, skipping token refresh");
    return;
  }

  try {
    const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));

    if (
      !Array.isArray(storageState.origins) ||
      storageState.origins.length === 0
    ) {
      console.log(
        "⚠️ No origins found in storage state, skipping token refresh",
      );
      return;
    }

    const firstOrigin = storageState.origins[0];
    const localStorage: LocalStorageItem[] = Array.isArray(
      firstOrigin.localStorage,
    )
      ? firstOrigin.localStorage
      : [];
    const accessTokenEntry = localStorage.find(
      (item: LocalStorageItem) => item.name === ACCESS_TOKEN_KEY,
    );
    const refreshTokenEntry = localStorage.find(
      (item: LocalStorageItem) => item.name === REFRESH_TOKEN_KEY,
    );

    if (!accessTokenEntry || !refreshTokenEntry) {
      console.log("⚠️ No tokens found in storage state");
      return;
    }

    const refreshToken = refreshTokenEntry.value;
    const apiUrl = process.env.REACT_CARE_API_URL || "http://localhost:9000";

    console.log("🔄 Refreshing authentication tokens...");

    const response = await fetch(`${apiUrl}/api/v1/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();

      const accessIndex = localStorage.findIndex(
        (item: LocalStorageItem) => item.name === ACCESS_TOKEN_KEY,
      );
      const refreshIndex = localStorage.findIndex(
        (item: LocalStorageItem) => item.name === REFRESH_TOKEN_KEY,
      );

      if (accessIndex !== -1) {
        localStorage[accessIndex].value = data.access;
      }
      if (refreshIndex !== -1 && data.refresh) {
        localStorage[refreshIndex].value = data.refresh;
      }

      fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));

      console.log("✅ Tokens refreshed successfully");
    } else {
      console.log(`⚠️ Token refresh failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Error refreshing tokens:", error);
  }
}

/**
 * Global setup that runs once before all tests.
 * 1. Restores database from snapshot (local only)
 * 2. Refreshes authentication tokens
 */
async function globalSetup(_config: FullConfig) {
  restoreDatabase();
  await refreshTokens();
}

export default globalSetup;
