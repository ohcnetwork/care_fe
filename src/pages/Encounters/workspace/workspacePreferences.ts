/** The backend stores class preferences as a string; an empty value is inactive. */
export function parseEncounterClasses(value: string | null): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((encounterClass) => encounterClass.trim())
      .filter(Boolean),
  );
}
