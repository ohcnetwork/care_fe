import {
  UseQueryResult,
  useInfiniteQuery,
  useQueries,
} from "@tanstack/react-query";
import { useMemo } from "react";

import {
  ChargeItemRead,
  ChargeItemServiceResource,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

const ITEMS_PER_PAGE = 200;

/**
 * Which of the account's charge items an invoice is being created from.
 * Callers describe the scope rather than passing charge item objects, so the
 * items are always read from the server (and refreshed by the usual
 * `chargeItems` invalidations) instead of from a snapshot that goes stale.
 */
export type ChargeItemScope =
  | { kind: "account" }
  | {
      kind: "service_resource";
      serviceResource: ChargeItemServiceResource;
      serviceResourceId: string;
    }
  /** An arbitrary set of items (e.g. those created by a dispense). */
  | { kind: "ids"; ids: string[] };

const combineDetailQueries = (results: UseQueryResult<ChargeItemRead>[]) => ({
  items: results.flatMap((result) => (result.data ? [result.data] : [])),
  isLoading: results.some((result) => result.isLoading),
  isFetching: results.some((result) => result.isFetching),
});

/**
 * Billable charge items of an account within `scope`.
 *
 * Scopes the list endpoint can filter on use a single paginated query. The
 * `ids` scope has no list filter, so each item is fetched individually; these
 * sets are small, and the per-item queries live under the `chargeItems` key so
 * they are refreshed along with every other charge item list.
 */
export function useInvoiceChargeItems({
  facilityId,
  accountId,
  scope,
}: {
  facilityId: string;
  accountId: string;
  scope: ChargeItemScope;
}) {
  const scopeParams =
    scope.kind === "service_resource"
      ? {
          service_resource: scope.serviceResource,
          service_resource_id: scope.serviceResourceId,
        }
      : {};

  const list = useInfiniteQuery({
    queryKey: ["infinite-chargeItems", accountId, "invoice", scopeParams],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(chargeItemApi.listChargeItem, {
        pathParams: { facilityId },
        queryParams: {
          ...scopeParams,
          limit: String(ITEMS_PER_PAGE),
          offset: String(pageParam),
          status: ChargeItemStatus.billable,
          account: accountId,
          ordering: "created_date",
        },
      })({ signal });
      return response as PaginatedResponse<ChargeItemRead>;
    },
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedResponse<ChargeItemRead>,
      allPages: PaginatedResponse<ChargeItemRead>[],
    ) => {
      const currentOffset = allPages.length * ITEMS_PER_PAGE;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: !!facilityId && !!accountId && scope.kind !== "ids",
  });

  const details = useQueries({
    queries: (scope.kind === "ids" ? scope.ids : []).map((chargeItemId) => ({
      queryKey: ["chargeItems", "detail", facilityId, chargeItemId],
      queryFn: query(chargeItemApi.retrieveChargeItem, {
        pathParams: { facilityId, chargeItemId },
      }),
      enabled: !!facilityId,
    })),
    combine: combineDetailQueries,
  });

  const isIdsScope = scope.kind === "ids";
  const source = isIdsScope
    ? details.items
    : list.data?.pages.flatMap((page) => page.results);

  // Items fetched individually keep coming back after they stop being
  // billable (e.g. aborted), so filter on status for every scope.
  const chargeItems = useMemo(
    () =>
      (source ?? []).filter(
        (item) => item.status === ChargeItemStatus.billable,
      ),
    [source],
  );

  return {
    chargeItems,
    isLoading: isIdsScope ? details.isLoading : list.isLoading,
    /** A refetch is in flight, so `chargeItems` may not match the server. */
    isSyncing: isIdsScope
      ? details.isFetching
      : list.isFetching && !list.isFetchingNextPage,
    hasNextPage: !isIdsScope && list.hasNextPage,
    isFetchingNextPage: list.isFetchingNextPage,
    fetchNextPage: list.fetchNextPage,
  };
}
