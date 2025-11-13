import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const META_PATH = path.resolve("tests/.auth/locationMeta.json");

interface LocationMetadata {
  facilityId: string;
  locationId: string;
  locationName: string;
  savedAt?: string;
}

let cachedMetadata: LocationMetadata | null = null;

/**
 * Returns the lab location metadata (facilityId, locationId, locationName) saved during setup.
 * Auto-runs the setup if the meta file is missing or invalid.
 */
export function getLabLocationMetadata(): LocationMetadata {
  if (cachedMetadata) return cachedMetadata;

  if (!fs.existsSync(META_PATH)) {
    console.warn(
      "⚠️ Lab location meta missing — running lab location setup...",
    );
    try {
      execSync(
        "npx playwright test --project=setup tests/setup/labLocation.setup.ts",
        {
          stdio: "inherit",
          cwd: process.cwd(),
        },
      );
    } catch (error) {
      throw new Error(
        `Failed to run lab location setup: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const raw = fs.readFileSync(META_PATH, "utf8");
  try {
    const metadata = JSON.parse(raw) as LocationMetadata;
    if (
      !metadata.facilityId ||
      !metadata.locationId ||
      !metadata.locationName
    ) {
      throw new Error(
        "Missing required fields in locationMeta.json (facilityId, locationId, or locationName)",
      );
    }
    cachedMetadata = metadata;
    return metadata;
  } catch (err) {
    throw new Error(
      `Invalid locationMeta.json: ${err instanceof Error ? err.message : err}`,
    );
  }
}

/**
 * Returns just the lab location ID.
 * Convenience function for tests that only need the location ID.
 */
export function getLabLocationId(): string {
  return getLabLocationMetadata().locationId;
}

/**
 * Returns just the lab location name.
 * Convenience function for tests that need the location name.
 */
export function getLabLocationName(): string {
  return getLabLocationMetadata().locationName;
}
