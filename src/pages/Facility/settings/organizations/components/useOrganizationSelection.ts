import { useCallback, useMemo, useState } from "react";

import type { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";

interface OrganizationSelectionOptions {
  value?: string[] | null;
  currentOrganizations?: FacilityOrganizationRead[];
  singleSelection: boolean;
  onChange: (
    value: string[] | null,
    organizations?: FacilityOrganizationRead[],
  ) => void;
}

const EMPTY_IDS: string[] = [];

/** The parent's IDs own controlled selection. Locally remembered records only
 * supply labels when a caller stores IDs without returning the selected records.
 * Callers without a value prop retain the selector's uncontrolled behavior. */
export function useOrganizationSelection({
  value,
  currentOrganizations,
  singleSelection,
  onChange,
}: OrganizationSelectionOptions) {
  const [local, setLocal] = useState(() => ({
    ids: EMPTY_IDS,
    records: new Map(
      currentOrganizations?.map(
        (organization) => [organization.id, organization] as const,
      ),
    ),
  }));
  const selectedIds = value === undefined ? local.ids : (value ?? EMPTY_IDS);
  // Keep the last known labels if a parent's query temporarily has no records.
  // Only genuinely new records update this cache; an inline prop array does
  // not cause a render loop. This never changes the parent's selected IDs.
  let knownRecords = local.records;
  for (const organization of currentOrganizations ?? []) {
    if (knownRecords.get(organization.id) === organization) continue;
    if (knownRecords === local.records) knownRecords = new Map(local.records);
    knownRecords.set(organization.id, organization);
  }
  if (knownRecords !== local.records) {
    setLocal({ ...local, records: knownRecords });
  }
  const selectedOrganizations = useMemo(() => {
    return selectedIds.flatMap((id) => {
      const organization = knownRecords.get(id);
      return organization ? [organization] : [];
    });
  }, [selectedIds, knownRecords]);

  const updateSelection = useCallback(
    (ids: string[], records: FacilityOrganizationRead[]) => {
      setLocal((previous) => ({
        ids,
        records: new Map([
          ...previous.records,
          ...records.map(
            (organization) => [organization.id, organization] as const,
          ),
        ]),
      }));
      onChange(ids.length > 0 ? ids : null, records);
    },
    [onChange],
  );

  const selectOrganization = useCallback(
    (organization: FacilityOrganizationRead) => {
      if (selectedIds.includes(organization.id)) return;
      updateSelection(
        singleSelection ? [organization.id] : [...selectedIds, organization.id],
        singleSelection
          ? [organization]
          : [...selectedOrganizations, organization],
      );
    },
    [selectedIds, selectedOrganizations, singleSelection, updateSelection],
  );

  const replaceSelection = useCallback(
    (organizations: FacilityOrganizationRead[]) => {
      updateSelection(
        organizations.map((organization) => organization.id),
        organizations,
      );
    },
    [updateSelection],
  );

  const removeOrganization = useCallback(
    (id: string) => {
      updateSelection(
        selectedIds.filter((selectedId) => selectedId !== id),
        selectedOrganizations.filter((organization) => organization.id !== id),
      );
    },
    [selectedIds, selectedOrganizations, updateSelection],
  );

  return {
    selectedIds,
    selectedOrganizations,
    selectOrganization,
    replaceSelection,
    removeOrganization,
  };
}
