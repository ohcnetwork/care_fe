import useUserPreferences from "@/hooks/useUserPreferences";

import { EncounterClass } from "@/types/emr/encounter/encounter";
import { EncounterListPreferences } from "@/types/user/userPreferences";
import careConfig from "@careConfig";

/** The class segment of an encounter list route. */
export type EncounterListClass = EncounterClass | "all";

/** Encounter lists a user can open; "all" only adds value with several classes. */
export const ENCOUNTER_LIST_CLASSES: EncounterListClass[] =
  careConfig.encounterClasses.length > 1
    ? ["all", ...careConfig.encounterClasses]
    : [...careConfig.encounterClasses];

/** The encounter list a user lands on, saved to their account preferences. */
export function useDefaultEncounterClass() {
  const { preferences, setPreference, isPending } = useUserPreferences({});
  const saved = (
    preferences.encounter_list as EncounterListPreferences | undefined
  )?.default_class;
  const defaultClass: EncounterListClass =
    ENCOUNTER_LIST_CLASSES.find((encounterClass) => encounterClass === saved) ||
    careConfig.defaultEncounterType ||
    "all";

  const setDefaultClass = (encounterClass: EncounterListClass) =>
    setPreference("encounter_list", { default_class: encounterClass });

  // Each save replaces the whole preference, so one must land before the next.
  return { defaultClass, setDefaultClass, isSaving: isPending };
}
