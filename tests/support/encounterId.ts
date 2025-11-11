import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const META_PATH = path.resolve("tests/.auth/encounterMeta.json");

interface EncounterMetadata {
  facilityId: string;
  patientId: string;
  encounterId: string;
  savedAt?: string;
}

let cachedMetadata: EncounterMetadata | null = null;

/**
 * Returns the encounter metadata (facilityId, patientId, encounterId) saved during setup.
 * Auto-runs the setup if the meta file is missing or invalid.
 */
export function getEncounterMetadata(): EncounterMetadata {
  if (cachedMetadata) return cachedMetadata;

  if (!fs.existsSync(META_PATH)) {
    console.warn("⚠️ Encounter meta missing — running encounter setup...");
    try {
      execSync(
        "npx playwright test --project=setup tests/setup/encounter.setup.ts",
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
    const metadata = JSON.parse(raw) as EncounterMetadata;
    if (!metadata.facilityId || !metadata.patientId || !metadata.encounterId) {
      throw new Error(
        "Missing required fields in encounterMeta.json (facilityId, patientId, or encounterId)",
      );
    }
    cachedMetadata = metadata;
    return metadata;
  } catch (err) {
    throw new Error(
      `Invalid encounterMeta.json: ${err instanceof Error ? err.message : err}`,
    );
  }
}

/**
 * Returns just the encounter ID.
 * Convenience function for tests that only need the encounter ID.
 */
export function getEncounterId(): string {
  return getEncounterMetadata().encounterId;
}

/**
 * Returns just the patient ID from the encounter metadata.
 * Convenience function for tests that only need the patient ID.
 */
export function getPatientId(): string {
  return getEncounterMetadata().patientId;
}
