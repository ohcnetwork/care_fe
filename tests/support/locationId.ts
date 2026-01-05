import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const META_PATH = path.resolve("tests/.auth/locationMeta.json");
let cachedId: string | null = null;

/**
 * Returns the locationId saved during setup.
 * Auto-runs the setup if the meta file is missing or invalid.
 */
export function getLocationId(): string {
  if (cachedId) return cachedId;

  if (!fs.existsSync(META_PATH)) {
    console.warn("⚠️ Location meta missing — running location setup...");
    try {
      execSync(
        "npx playwright test --project=setup tests/setup/location.setup.ts",
        {
          stdio: "inherit",
          cwd: process.cwd(),
        },
      );
    } catch (error) {
      throw new Error(
        `Failed to run location setup: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const raw = fs.readFileSync(META_PATH, "utf8");
  try {
    const { id } = JSON.parse(raw);
    if (!id) throw new Error(`Missing id in location meta file: ${META_PATH}`);
    cachedId = id;
    return id;
  } catch (err) {
    throw new Error(
      `Invalid locationMeta.json: ${err instanceof Error ? err.message : err}`,
    );
  }
}
