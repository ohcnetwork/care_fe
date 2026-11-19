import { useMemo } from "react";

import { useInfiniteList } from "@/hooks/useInfiniteList";
import {
  ChargeItemServiceResource,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import query from "@/Utils/request/query";

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
    };

/** Billable charge items of an account within `scope`. */
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

  const list = useInfiniteList({
    queryKey: [
      "infinite-chargeItems",
      accountId,
      "invoice",
      scope.kind,
      scopeParams,
    ],
    ...query.infinite(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      pageSize: 200,
      queryParams: {
        ...scopeParams,
        status: ChargeItemStatus.billable,
        account: accountId,
        ordering: "created_date",
      },
    }),
    enabled: !!facilityId && !!accountId,
  });

  const chargeItems = useMemo(() => list.data?.results ?? [], [list.data]);

  return {
    chargeItems,
    isLoading: list.isLoading,
    /** A refetch is in flight, so `chargeItems` may not match the server. */
    isSyncing: list.isFetching && !list.isFetchingNextPage,
    hasNextPage: list.hasNextPage,
    isFetchingNextPage: list.isFetchingNextPage,
    fetchNextPage: list.fetchNextPage,
  };
}
