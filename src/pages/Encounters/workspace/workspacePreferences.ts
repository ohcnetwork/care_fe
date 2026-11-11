import type { WorkspaceUserDefaultAttributes } from "@/types/workspace/workspace";

/** One saved choice drives both encounter pages and clinical history. */
export const WORKSPACE_SCOPE_ATTRIBUTE = "scope";
export const WORKSPACE_SCOPE_ALL = "all";
/** Earlier per-class choices are still honoured until the user picks again. */
export const LEGACY_ENCOUNTER_CLASS_ATTRIBUTE = "encounter_class";

/** The backend stores class preferences as a string; an empty value is inactive. */
export function parseEncounterClasses(value: string | null): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((encounterClass) => encounterClass.trim())
      .filter(Boolean),
  );
}

/**
 * Keeps the defaults API's order and skips workspaces the user can no longer
 * open. The single workspace choice wins over legacy per-class choices, which
 * only ever applied to encounters.
 */
export function findPreferredWorkspaceId(
  rules: WorkspaceUserDefaultAttributes[],
  accessibleIds: ReadonlySet<string>,
  encounterClass?: string,
): string | undefined {
  const accessible = rules.filter(({ workspace }) =>
    accessibleIds.has(workspace.id),
  );
  return (
    accessible.find(
      ({ attribute, value }) =>
        attribute === WORKSPACE_SCOPE_ATTRIBUTE &&
        value === WORKSPACE_SCOPE_ALL,
    ) ??
    (encounterClass === undefined
      ? undefined
      : accessible.find(
          ({ attribute, value }) =>
            attribute === LEGACY_ENCOUNTER_CLASS_ATTRIBUTE &&
            parseEncounterClasses(value).has(encounterClass),
        ))
  )?.workspace.id;
}
