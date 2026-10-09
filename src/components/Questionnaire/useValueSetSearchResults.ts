import { useQuery } from "@tanstack/react-query";

import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";

interface ValueSetSearchResultsOptions {
  system: string;
  pinnedValuesetId?: string;
  facilityId?: string;
  count: number;
  search: string;
  searchPostFix: string;
}

/** Keeps expansion results separate from the stable slug-to-id resolution. */
export function useValueSetSearchResults({
  system,
  pinnedValuesetId,
  facilityId,
  count,
  search,
  searchPostFix,
}: ValueSetSearchResultsOptions) {
  const pinnedSearchQuery = useQuery({
    queryKey: [
      "valueset",
      pinnedValuesetId,
      "expand",
      count,
      search,
      searchPostFix,
    ],
    queryFn: query.debounced(valueSetApi.expand, {
      pathParams: { id: pinnedValuesetId ?? "" },
      body: {
        count,
        search: search + searchPostFix,
      },
    }),
    enabled: !!pinnedValuesetId,
  });

  const slugSearchQuery = useQuery({
    queryKey: [
      "valueset",
      system,
      facilityId,
      "expand_slug",
      count,
      search,
      searchPostFix,
    ],
    queryFn: query.debounced(valueSetApi.expandSlug, {
      body: {
        slug: system,
        facility: facilityId,
        count,
        search: search + searchPostFix,
      },
    }),
    enabled: !pinnedValuesetId && !!system,
  });

  const searchQuery = pinnedValuesetId ? pinnedSearchQuery : slugSearchQuery;

  // The slug -> valueset mapping does not vary with the search term, so it is
  // resolved on its own key. Deriving it from slugSearchQuery would drop it on
  // every keystroke, and the write endpoints are still id-keyed.
  const resolveQuery = useQuery({
    queryKey: ["valueset", "resolve", system, facilityId],
    queryFn: query(valueSetApi.expandSlug, {
      body: { slug: system, facility: facilityId, search: "", count: 1 },
      silent: true,
    }),
    enabled: !pinnedValuesetId && !!system,
    staleTime: Infinity,
  });

  const valuesetId = pinnedValuesetId ?? resolveQuery.data?.valueset.id;

  return { searchQuery, resolveQuery, valuesetId };
}
