import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { isLotAllowedForDispensing } from "@/Utils/inventory";
import query from "@/Utils/request/query";

interface LotSelection {
  selectedInventoryId: string;
  quantity: string;
}

interface UseInventoryLotAutoSelectionOptions {
  /** Facility ID for inventory lookup */
  facilityId: string;
  /** Location ID for inventory lookup */
  locationId: string;
  /** List of product knowledge IDs to fetch inventories for */
  productKnowledgeIds: string[];
  /**
   * Callback to get current lot selections for auto-selection logic.
   * Called for each product knowledge ID to check if auto-selection is needed.
   * Return the current lots array for the given product knowledge ID.
   */
  getCurrentLots?: (productKnowledgeId: string) => LotSelection[] | undefined;
  /**
   * Callback to set lot selection when auto-selecting.
   * Called when a valid lot is found and should be auto-selected.
   */
  onAutoSelectLot?: (productKnowledgeId: string, lot: LotSelection) => void;
}

/**
 * Hook for fetching inventories for product knowledge items and optionally
 * auto-selecting the first valid (non-expired) lot for dispensing.
 *
 * This hook:
 * 1. Uses useQueries to fetch inventories in parallel for all provided product knowledge IDs
 * 2. Optionally auto-selects the first valid lot when inventories are loaded (via callbacks)
 *
 * @example
 * ```tsx
 * const { productKnowledgeInventoriesMap, isLoading } = useInventoryLotAutoSelection({
 *   facilityId,
 *   locationId,
 *   productKnowledgeIds: fields.map(f => f.productKnowledge?.id).filter(Boolean),
 *   getCurrentLots: (pkId) => {
 *     const index = fields.findIndex(f => f.productKnowledge?.id === pkId);
 *     return index >= 0 ? form.getValues(`items.${index}.lots`) : undefined;
 *   },
 *   onAutoSelectLot: (pkId, lot) => {
 *     const index = fields.findIndex(f => f.productKnowledge?.id === pkId);
 *     if (index >= 0) form.setValue(`items.${index}.lots`, [lot]);
 *   },
 * });
 * ```
 */
export default function useInventoryLotAutoSelection({
  facilityId,
  locationId,
  productKnowledgeIds,
  getCurrentLots,
  onAutoSelectLot,
}: UseInventoryLotAutoSelectionOptions) {
  // Deduplicate product knowledge IDs
  const uniqueProductKnowledgeIds = useMemo(
    () => [...new Set(productKnowledgeIds.filter(Boolean))],
    [productKnowledgeIds],
  );

  // Fetch inventories for all product knowledge IDs in parallel using useQueries
  const inventoryQueries = useQueries({
    queries: uniqueProductKnowledgeIds.map((productKnowledgeId) => ({
      queryKey: [
        "inventory",
        facilityId,
        locationId,
        productKnowledgeId,
      ] as const,
      queryFn: query(inventoryApi.list, {
        pathParams: { facilityId, locationId },
        queryParams: {
          limit: 100,
          product_knowledge: productKnowledgeId,
          net_content_gt: 0,
          include_children: true,
        },
      }),
      enabled: !!productKnowledgeId && !!facilityId && !!locationId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    })),
  });

  // Build a map of product knowledge ID to inventories
  const productKnowledgeInventoriesMap = useMemo(() => {
    const map: Record<string, InventoryRead[] | undefined> = {};

    uniqueProductKnowledgeIds.forEach((id, index) => {
      const queryResult = inventoryQueries[index];
      if (queryResult?.data) {
        map[id] = queryResult.data.results || [];
      } else if (queryResult?.isLoading) {
        // Keep as undefined while loading
        map[id] = undefined;
      } else {
        // No data and not loading - set empty array
        map[id] = [];
      }
    });

    return map;
  }, [uniqueProductKnowledgeIds, inventoryQueries]);

  // Check if any queries are still loading
  const isLoading = inventoryQueries.some((q) => q.isLoading);

  // Auto-select first valid (non-expired) lot when inventories are loaded
  useEffect(() => {
    if (!getCurrentLots || !onAutoSelectLot) return;

    uniqueProductKnowledgeIds.forEach((productKnowledgeId) => {
      const inventories = productKnowledgeInventoriesMap[productKnowledgeId];
      const currentLots = getCurrentLots(productKnowledgeId);

      // Only auto-select if inventories are loaded and no lot is currently selected
      if (
        inventories !== undefined &&
        inventories.length > 0 &&
        currentLots &&
        !currentLots.some((lot) => lot.selectedInventoryId)
      ) {
        // Find first valid (non-expired) lot
        const validLot = inventories.find((inv) =>
          isLotAllowedForDispensing(inv.product.expiration_date),
        );

        if (validLot) {
          onAutoSelectLot(productKnowledgeId, {
            selectedInventoryId: validLot.id,
            quantity: currentLots[0]?.quantity || "1",
          });
        }
      }
    });
  }, [
    productKnowledgeInventoriesMap,
    uniqueProductKnowledgeIds,
    getCurrentLots,
    onAutoSelectLot,
  ]);

  return {
    /** Map of product knowledge ID to inventory items */
    productKnowledgeInventoriesMap,
    /** Whether any inventory queries are still loading */
    isLoading,
    /** Individual query results for each product knowledge ID */
    inventoryQueries,
  };
}
