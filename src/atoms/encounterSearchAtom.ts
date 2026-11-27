import { atomWithStorage } from "jotai/utils";
import { Country } from "react-phone-number-input";

import careConfig from "@careConfig";

import type { SearchField } from "@/pages/Encounters/encounter-search/encounterSearchFields";

export interface EncounterSearchPreference {
  /** The field the All Encounters search applies its text to. */
  field: SearchField;
  /** The country phone numbers without a `+` code are read in. */
  country: Country;
}

export const ENCOUNTER_SEARCH_PREFERENCE_KEY = "care_encounter_search_pref";

/**
 * The last field and phone country picked in the All Encounters search, kept in
 * localStorage so the next visit starts where the user left off.
 * `getOnInit: true` makes the first render see the stored value.
 */
export const encounterSearchPreferenceAtom =
  atomWithStorage<EncounterSearchPreference>(
    ENCOUNTER_SEARCH_PREFERENCE_KEY,
    { field: "auto", country: careConfig.defaultCountry.code },
    undefined,
    { getOnInit: true },
  );
