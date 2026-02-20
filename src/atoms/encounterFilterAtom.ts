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
export const encounterHistoryFiltersAtom =
  atomWithStorage<EncounterHistoryFilters>(
    "encounter_history_filters",
    defaultHistoryFilters,
    createJSONStorage(() => sessionStorage),
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
export const encounterListFiltersAtom = atomWithStorage<EncounterListFilters>(
  "encounter_list_filters",
  defaultListFilters,
  createJSONStorage(() => sessionStorage),
);
