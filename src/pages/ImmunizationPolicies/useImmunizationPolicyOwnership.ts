import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";

import { callApi } from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  ImmunizationPolicyRead,
  ImmunizationPolicyScope,
} from "@/types/emr/immunizationPolicy/immunizationPolicy";
import immunizationPolicyApi from "@/types/emr/immunizationPolicy/immunizationPolicyApi";

interface ImmunizationPolicyOwnership {
  ownership: "instance" | "facility" | "unknown";
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
  /** Scope ownership only; callers must also check write permission. */
  canEditHere: boolean;
}

export async function fetchImmunizationPolicyCatalogue(
  signal: AbortSignal,
  facilityId?: string,
): Promise<PaginatedResponse<ImmunizationPolicyRead>> {
  const policies: ImmunizationPolicyRead[] = [];
  const ids = new Set<string>();
  let expectedCount: number | undefined;
  let offset = 0;

  while (true) {
    const page = await callApi(immunizationPolicyApi.list, {
      signal,
      queryParams: {
        limit: 100,
        offset,
        ...(facilityId ? { facility: facilityId } : {}),
      },
    });

    // Ownership must never be inferred from a truncated or shifting list.
    if (
      !Number.isSafeInteger(page.count) ||
      page.count < 0 ||
      !Array.isArray(page.results) ||
      (expectedCount !== undefined && page.count !== expectedCount)
    ) {
      throw new Error(t("immunization_policy_unknown_scope"));
    }
    expectedCount = page.count;

    for (const policy of page.results) {
      if (!policy.id || ids.has(policy.id)) {
        throw new Error(t("immunization_policy_unknown_scope"));
      }
      ids.add(policy.id);
      policies.push(policy);
    }
    if (ids.size === expectedCount) {
      return { count: expectedCount, results: policies };
    }
    if (ids.size > expectedCount || page.results.length === 0) {
      throw new Error(t("immunization_policy_unknown_scope"));
    }
    offset += page.results.length;
  }
}

export function useImmunizationPolicyOwnership(
  scope: ImmunizationPolicyScope,
  policy?: ImmunizationPolicyRead,
): ImmunizationPolicyOwnership {
  const needsLookup = !!policy && policy.facility === undefined;
  const instancePolicies = useQuery({
    queryKey: ["immunization-policies", "instance-catalogue"],
    queryFn: ({ signal }) => fetchImmunizationPolicyCatalogue(signal),
    enabled: needsLookup,
    refetchOnWindowFocus: false,
  });
  const isKnownInstance =
    instancePolicies.isSuccess &&
    !!policy &&
    instancePolicies.data.results.some((entry) => entry.id === policy.id);
  const needsFacilityLookup =
    needsLookup &&
    !!scope.facilityId &&
    instancePolicies.isSuccess &&
    !instancePolicies.isFetching &&
    !isKnownInstance;
  const facilityPolicies = useQuery({
    queryKey: ["immunization-policies", "facility-catalogue", scope.facilityId],
    queryFn: ({ signal }) =>
      fetchImmunizationPolicyCatalogue(signal, scope.facilityId),
    enabled: needsFacilityLookup,
    refetchOnWindowFocus: false,
  });

  let ownership: ImmunizationPolicyOwnership["ownership"] = "unknown";
  if (policy?.facility === null) {
    ownership = "instance";
  } else if (
    policy?.facility !== undefined &&
    policy.facility === scope.facilityId
  ) {
    ownership = "facility";
  } else if (needsLookup) {
    if (isKnownInstance) ownership = "instance";
    else if (
      needsFacilityLookup &&
      facilityPolicies.isSuccess &&
      !facilityPolicies.isFetching &&
      facilityPolicies.data.results.some((entry) => entry.id === policy.id)
    ) {
      ownership = "facility";
    }
  }

  return {
    ownership,
    canEditHere: ownership === (scope.facilityId ? "facility" : "instance"),
    isLoading:
      (needsLookup && instancePolicies.isPending) ||
      (needsFacilityLookup && facilityPolicies.isPending),
    isError:
      (needsLookup && instancePolicies.isError) ||
      (needsFacilityLookup && facilityPolicies.isError),
    refetch: async () => {
      if (!needsLookup || !policy) return;
      const instances = await instancePolicies.refetch();
      if (
        instances.isSuccess &&
        !instances.data.results.some((entry) => entry.id === policy.id) &&
        scope.facilityId
      ) {
        await facilityPolicies.refetch();
      }
    },
  };
}
