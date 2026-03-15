import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { getFacilityIdFromManifest } from "./fixtureManifest";

const META_PATH = path.resolve("tests/.auth/facilityMeta.json");
let cachedId: string | null = null;

/**
 * Returns the facilityId.
 * Prefers the backend fixture manifest (written by load_fixtures --output-json).
 * Falls back to the legacy meta file written by facility.setup.ts.
 */
export function getFacilityId(): string {
  if (cachedId) return cachedId;

  // Try manifest first
  const manifestId = getFacilityIdFromManifest();
  if (manifestId) {
    cachedId = manifestId;
    return manifestId;
  }

  // Fall back to legacy meta file
  if (!fs.existsSync(META_PATH)) {
    console.warn("⚠️ Facility meta missing — running facility setup...");
    try {
      execSync(
        "npx playwright test --project=setup tests/setup/facility.setup.ts",
        {
          stdio: "inherit",
          cwd: process.cwd(),
        },
      );
    } catch (error) {
      throw new Error(
        `Failed to run facility setup: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const raw = fs.readFileSync(META_PATH, "utf8");
  try {
    const { id } = JSON.parse(raw);
    if (!id) throw new Error("Missing id in facilityMeta.json");
    cachedId = id;
    return id;
  } catch (err) {
    throw new Error(
      `Invalid facilityMeta.json: ${err instanceof Error ? err.message : err}`,
    );
  }
}
