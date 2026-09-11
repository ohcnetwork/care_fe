import { useQuery } from "@tanstack/react-query";
import { TFunction } from "i18next";

import {
  ValueSetAuthContext,
  ValueSetRead,
  ValueSetStatus,
} from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";

export interface ScopedValueSet {
  valueset: ValueSetRead;
  /** Which list the set came from. `ValueSetReadSpec` does not return
   *  `auth_context`, so this is the only scope signal the UI has. */
  authContext: Extract<ValueSetAuthContext, "instance" | "facility">;
}

/** Where a value set lives, as a label. Only ever shown where the two
 *  lists are merged — an instance set and a facility override of it
 *  usually share a name. */
export function scopeLabel(
  authContext: ScopedValueSet["authContext"],
  t: TFunction,
): string {
  return t(authContext === "facility" ? "this_facility" : "instance");
}

/** `Name (This facility)` — the merged-list option label. */
export function scopedOptionLabel(
  { valueset, authContext }: ScopedValueSet,
  t: TFunction,
): string {
  return `${valueset.name} (${scopeLabel(authContext, t)})`;
}

const PAGE = 50;

/**
 * Active value sets a picker inside `facilityId` (or the admin area, when
 * undefined) may choose from: the instance-level sets, plus — inside a
 * facility — that facility's own sets, listed first. Two requests because
 * the list endpoint filters by either `auth_context` or `facility` and its
 * read spec carries neither back.
 */
export function useScopedValueSets({
  facilityId,
  search,
}: {
  facilityId?: string;
  search: string;
}): { options: ScopedValueSet[]; isFetching: boolean } {
  const params = {
    name: search || undefined,
    status: ValueSetStatus.ACTIVE,
    limit: PAGE,
  };

  const instance = useQuery({
    queryKey: ["valuesets", "scoped", "instance", search],
    queryFn: query.debounced(valueSetApi.list, {
      queryParams: { ...params, auth_context: "instance" },
    }),
  });

  const facility = useQuery({
    queryKey: ["valuesets", "scoped", "facility", facilityId, search],
    queryFn: query.debounced(valueSetApi.list, {
      queryParams: { ...params, facility: facilityId },
    }),
    enabled: !!facilityId,
  });

  const options: ScopedValueSet[] = [
    ...(facility.data?.results ?? []).map((valueset) => ({
      valueset,
      authContext: "facility" as const,
    })),
    ...(instance.data?.results ?? []).map((valueset) => ({
      valueset,
      authContext: "instance" as const,
    })),
  ];

  return {
    options,
    isFetching: instance.isFetching || facility.isFetching,
  };
}
