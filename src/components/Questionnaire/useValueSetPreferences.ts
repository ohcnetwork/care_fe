import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { CodeConceptMinimal } from "@/types/base/code/code";
import valueSetApi from "@/types/valueSet/valueSetApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface ValueSetPreferencesOptions {
  system: string;
  pinnedValuesetId?: string;
  facilityId?: string;
  valuesetId?: string;
}

/** Reads preferences by the picker binding and writes only after it resolves. */
export function useValueSetPreferences({
  system,
  pinnedValuesetId,
  facilityId,
  valuesetId,
}: ValueSetPreferencesOptions) {
  const queryClient = useQueryClient();
  const [itemToRemove, setItemToRemove] = useState<CodeConceptMinimal | null>(
    null,
  );
  const [showBulkClearConfirm, setShowBulkClearConfirm] = useState(false);
  // Keyed by whichever identifier addressed the read, so a pinned picker and a
  // slug picker of the same valueset hold separate entries.
  const favouritesKey = [
    "valueset",
    pinnedValuesetId ?? system,
    facilityId,
    "favourites",
  ];
  const recentsKey = [
    "valueset",
    pinnedValuesetId ?? system,
    facilityId,
    "recents",
  ];

  const favouritesQuery = useQuery({
    queryKey: favouritesKey,
    queryFn: pinnedValuesetId
      ? query(valueSetApi.favourites, {
          pathParams: { id: pinnedValuesetId },
        })
      : query(valueSetApi.favouritesBySlug, {
          queryParams: { slug: system, facility: facilityId },
          // An unresolvable slug already surfaces through the search request.
          silent: true,
        }),
    enabled: !!pinnedValuesetId || !!system,
  });

  const addFavouriteMutation = useMutation({
    mutationFn: mutate(valueSetApi.addFavourite, {
      pathParams: { id: valuesetId ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouritesKey });
    },
  });

  const removeFavouriteMutation = useMutation({
    mutationFn: mutate(valueSetApi.removeFavourite, {
      pathParams: { id: valuesetId ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouritesKey });
      setItemToRemove(null);
    },
    onError: () => {
      setItemToRemove(null);
    },
  });

  const clearFavouritesMutation = useMutation({
    mutationFn: mutate(valueSetApi.clearFavourites, {
      pathParams: { id: valuesetId ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouritesKey });
      setShowBulkClearConfirm(false);
    },
    onError: () => {
      setShowBulkClearConfirm(false);
    },
  });

  const recentsQuery = useQuery({
    queryKey: recentsKey,
    queryFn: pinnedValuesetId
      ? query(valueSetApi.recentViews, {
          pathParams: { id: pinnedValuesetId },
        })
      : query(valueSetApi.recentViewsBySlug, {
          queryParams: { slug: system, facility: facilityId },
          silent: true,
        }),
    enabled: !!pinnedValuesetId || !!system,
  });

  const addRecentMutation = useMutation({
    mutationFn: mutate(valueSetApi.addRecentView, {
      pathParams: { id: valuesetId ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recentsKey });
    },
  });

  // The starred column renders before the slug resolves, so every id-keyed
  // write has to be held back until there is an id to address.
  const canMutatePreferences = !!valuesetId;

  return {
    favouritesQuery,
    recentsQuery,
    addFavouriteMutation,
    removeFavouriteMutation,
    clearFavouritesMutation,
    addRecentMutation,
    canMutatePreferences,
    itemToRemove,
    setItemToRemove,
    showBulkClearConfirm,
    setShowBulkClearConfirm,
  };
}
