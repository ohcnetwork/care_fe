import fs from "fs";
import path from "path";

/**
 * Shape of the fixture manifest written by the backend's
 * `manage.py load_fixtures --output-json`.
 */
interface FixtureManifest {
  admin: { username: string; password: string };
  facility: { id: string; name: string };
  geo_organization_id: string;
  facility_organization_id: string;
  patients: Array<{
    id: string;
    name: string;
    encounters: Array<{ id: string }>;
  }>;
  users: Array<{ username: string; password: string; role: string }>;
  locations: Array<{ id: string; name: string }>;
  devices: Array<{ id: string; name: string }>;
}

const MANIFEST_PATH = path.resolve("tests/.auth/fixture_manifest.json");
let cached: FixtureManifest | null = null;

/**
 * Returns the fixture manifest written by the backend, or null if
 * unavailable. Callers fall back to individual meta files when null.
 */
export function getFixtureManifest(): FixtureManifest | null {
  if (cached) return cached;

  if (!fs.existsSync(MANIFEST_PATH)) {
    return null;
  }

  const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
  try {
    cached = JSON.parse(raw) as FixtureManifest;
    return cached;
  } catch (error) {
    console.warn(
      `Invalid fixture_manifest.json at ${MANIFEST_PATH}: ${error instanceof Error ? error.message : String(error)}. Falling back to legacy meta files.`,
    );
    return null;
  }
}

/**
 * Returns the facility ID from the manifest, or null if unavailable.
 */
export function getFacilityIdFromManifest(): string | null {
  const manifest = getFixtureManifest();
  return manifest?.facility?.id ?? null;
}

/**
 * Returns the first patient ID from the manifest, or null if unavailable.
 */
export function getPatientIdFromManifest(): string | null {
  const manifest = getFixtureManifest();
  return manifest?.patients?.[0]?.id ?? null;
}

/**
 * Returns the first encounter ID from the manifest, or null if unavailable.
 */
export function getEncounterIdFromManifest(): string | null {
  const manifest = getFixtureManifest();
  return manifest?.patients?.[0]?.encounters?.[0]?.id ?? null;
}
