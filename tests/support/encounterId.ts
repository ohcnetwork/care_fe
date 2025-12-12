import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const META_PATH = path.resolve("tests/.auth/encounterMeta.json");
let cachedId: string | null = null;

/**
 * Returns the encounterId saved during setup.
 * Auto-runs the setup if the meta file is missing or invalid.
 */
export function getEncounterId(): string {
  if (cachedId) return cachedId;

  if (!fs.existsSync(META_PATH)) {
    console.warn("⚠️ Encounter meta missing — running encounter setup...");
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
        `Failed to run encounter setup: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const raw = fs.readFileSync(META_PATH, "utf8");
  try {
    const { id } = JSON.parse(raw);
    if (!id) throw new Error(`Missing id in encounter meta file: ${META_PATH}`);
    cachedId = id;
    return id;
  } catch (err) {
    throw new Error(
      `Invalid encounterMeta.json: ${err instanceof Error ? err.message : err}`,
    );
  }
}
