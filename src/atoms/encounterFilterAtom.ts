import { atomFamily } from "jotai-family";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { UserReadMinimal } from "@/types/user/user";

export interface EncounterHistoryFilters {
  status?: string;
  selectedTags: TagConfig[];
  tagsBehavior: string;
  selectedOrg?: FacilityOrganizationRead;
  selectedCareTeamMember?: UserReadMinimal;
  dateFrom?: string; // ISO string for serialization
  dateTo?: string; // ISO string for serialization
}

const defaultHistoryFilters: EncounterHistoryFilters = {
  status: undefined,
  selectedTags: [],
  tagsBehavior: "any",
  selectedOrg: undefined,
  selectedCareTeamMember: undefined,
  dateFrom: undefined,
  dateTo: undefined,
};

/**
 * Atom for persisting encounter history filters
 * Uses sessionStorage to persist filters during the session
 */
export const encounterHistoryFiltersAtom = atomFamily((scope: string) =>
  atomWithStorage<EncounterHistoryFilters>(
    encounterFilterStorageKey("history", scope),
    defaultHistoryFilters,
    createJSONStorage(() => sessionStorage),
    { getOnInit: true },
  ),
);

export interface EncounterListFilters {
  status?: string;
  priority?: string;
  selectedTags: TagConfig[];
  tagsBehavior: string;
  selectedOrg?: FacilityOrganizationRead;
  selectedCareTeamMember?: UserReadMinimal;
  dateFrom?: string; // ISO string for serialization
  dateTo?: string; // ISO string for serialization
}

const defaultListFilters: EncounterListFilters = {
  status: undefined,
  priority: undefined,
  selectedTags: [],
  tagsBehavior: "any",
  selectedOrg: undefined,
  selectedCareTeamMember: undefined,
  dateFrom: undefined,
  dateTo: undefined,
};

/**
 * Atom for persisting encounter list filters
 * Uses sessionStorage to persist filters during the session
 */
export const encounterListFiltersAtom = atomFamily((scope: string) =>
  atomWithStorage<EncounterListFilters>(
    encounterFilterStorageKey("list", scope),
    defaultListFilters,
    createJSONStorage(() => sessionStorage),
    { getOnInit: true },
  ),
);

/** Unscoped legacy filters are deliberately not restored across facilities. */
export function encounterFilterStorageKey(
  kind: "list" | "history",
  scope: string,
) {
  return `encounter_${kind}_filters:${scope}`;
}
