import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { getPatientIdFromManifest } from "./fixtureManifest";

const META_PATH = path.resolve("tests/.auth/patientMeta.json");
let cachedId: string | null = null;

/**
 * Returns the patientId.
 * Prefers the backend fixture manifest (written by load_fixtures --output-json).
 * Falls back to the legacy meta file written by patient.setup.ts.
 */
export function getPatientId(): string {
  if (cachedId) return cachedId;

  // Try manifest first
  const manifestId = getPatientIdFromManifest();
  if (manifestId) {
    cachedId = manifestId;
    return manifestId;
  }

  // Fall back to legacy meta file
  if (!fs.existsSync(META_PATH)) {
    console.warn("⚠️ Patient meta missing — running patient setup...");
    try {
      execSync(
        "npx playwright test --project=setup tests/setup/patient.setup.ts",
        {
          stdio: "inherit",
          cwd: process.cwd(),
        },
      );
    } catch (error) {
      throw new Error(
        `Failed to run patient setup: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const raw = fs.readFileSync(META_PATH, "utf8");
  try {
    const { id } = JSON.parse(raw);
    if (!id) throw new Error(`Missing id in patient meta file: ${META_PATH}`);
    cachedId = id;
    return id;
  } catch (err) {
    throw new Error(
      `Invalid patientMeta.json: ${err instanceof Error ? err.message : err}`,
    );
  }
}
