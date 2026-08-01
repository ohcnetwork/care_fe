import { useQuery } from "@tanstack/react-query";

import { Code } from "@/types/base/code/code";
import { ValueSetConfig } from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";

/** A unit-choice set renders as inline chips only when the WHOLE expansion
 *  fits this budget; larger (or unexpandable) sets fall back to the search
 *  popover. */
export const INLINE_UNIT_CHOICES_MAX = 8;

/** Ask for one more than the budget: a full probe page proves the set is
 *  larger than the budget without fetching everything. */
const PROBE_COUNT = INLINE_UNIT_CHOICES_MAX + 1;

interface ValueSetExpansion {
  /** The complete expansion when the set is bounded (1..MAX codes).
   *  Undefined while loading, on error, for empty expansions and for sets
   *  larger than the budget — callers fall back to the search popover. */
  boundedCodes?: Code[];
  isLoading: boolean;
}

/**
 * One-shot bounded expansion of a question's `answer_value_set` (cached via
 * the normal query layer, keyed by valueset identity). Both expand routes
 * hit the FHIR terminology server ($expand), so failures are expected
 * offline — `silent` keeps them from toasting and the caller degrades to
 * the popover.
 */
export function useValueSetExpansion(
  config?: ValueSetConfig,
): ValueSetExpansion {
  const byId = useQuery({
    queryKey: ["qv2-valueset-expansion", "id", config?.external_id],
    queryFn: query(valueSetApi.expand, {
      pathParams: { id: config?.external_id ?? "" },
      body: { search: "", count: PROBE_COUNT },
      silent: true,
    }),
    enabled: !!config?.external_id,
  });

  const bySlug = useQuery({
    queryKey: ["qv2-valueset-expansion", "slug", config?.slug],
    queryFn: query(valueSetApi.expandSlug, {
      body: { slug: config?.slug ?? "", search: "", count: PROBE_COUNT },
      silent: true,
    }),
    enabled: !config?.external_id && !!config?.slug,
  });

  const results = config?.external_id
    ? byId.data?.results
    : bySlug.data?.results;

  const boundedCodes =
    results && results.length > 0 && results.length <= INLINE_UNIT_CHOICES_MAX
      ? results.map(({ system, code, display }) => ({ system, code, display }))
      : undefined;

  return {
    boundedCodes,
    isLoading: config?.external_id ? byId.isLoading : bySlug.isLoading,
  };
}
