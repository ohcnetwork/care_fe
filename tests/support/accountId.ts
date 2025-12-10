import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const META_PATH = path.resolve("tests/.auth/accountMeta.json");
let cachedId: string | null = null;

/**
 * Returns the accountId saved during setup.
 * Auto-runs the setup if the meta file is missing or invalid.
 */
export function getAccountId(): string {
  if (cachedId) return cachedId;

  if (!fs.existsSync(META_PATH)) {
    console.warn("⚠️ Account meta missing — running account setup...");
    try {
      execSync(
        "npx playwright test --project=setup tests/setup/patientAccount.setup.ts",
        {
          stdio: "inherit",
          cwd: process.cwd(),
        },
      );
    } catch (error) {
      throw new Error(
        `Failed to run account setup: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const raw = fs.readFileSync(META_PATH, "utf8");
  try {
    const { id } = JSON.parse(raw);
    if (!id) throw new Error(`Missing id in account meta file: ${META_PATH}`);
    cachedId = id;
    return id;
  } catch (err) {
    throw new Error(
      `Invalid accountMeta.json: ${err instanceof Error ? err.message : err}`,
    );
  }
}
