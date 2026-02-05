import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { isLotAllowedForDispensing } from "@/Utils/inventory";
import query from "@/Utils/request/query";

export interface InventorySelection {
  inventoryId: string;
  quantity: string;
  inventory: InventoryRead;
}

export interface UseInventoryItemAutoSelectOptions {
  facilityId: string;
  locationId: string;
  /**
   * Map of product knowledge ID to required quantity (whole number).
   * Each unique product knowledge should appear only once.
   */
  requirements: Record<string, number>;
  /**
   * Whether to include child location inventories. Defaults to true.
   */
  includeChildren?: boolean;
  /**
   * Callback to update the parent's inventory map state.
   */
  onInventoriesFetched: (map: Record<string, InventoryRead[]>) => void;
}

export interface UseInventoryItemAutoSelectResult {
  isLoading: boolean;
  /**
   * Map of product knowledge ID to auto-selected inventory batches (FEFO).
   * Only populated on initial load.
   */
  selections: Record<string, InventorySelection[]>;
  /**
   * Set of product knowledge IDs where available stock < required quantity.
   */
  insufficientProductKnowledgeIds: Set<string>;
  /**
   * Raw inventory map keyed by product knowledge ID.
   */
  inventoriesMap: Record<string, InventoryRead[]>;
}

/**
 * Hook that fetches inventory items for multiple product knowledge IDs in parallel,
 * computes FEFO (First Expiry First Out) batch selections to meet required quantities,
 * and flags insufficient stock.
 *
 * Auto-selection runs only on initial load; manual form edits override selections.
 */
export function useInventoryItemAutoSelect({
  facilityId,
  locationId,
  requirements,
  includeChildren = true,
  onInventoriesFetched,
}: UseInventoryItemAutoSelectOptions): UseInventoryItemAutoSelectResult {
  // Use sorted keys to ensure stable comparison
  const productKnowledgeIds = Object.keys(requirements).sort();

  // Track whether initial selection has been computed
  const hasComputedInitialSelection = useRef(false);

  // Fetch inventories for each product knowledge ID in parallel
  const { isLoading, data: inventoriesMap } = useQueries({
    queries: productKnowledgeIds.map((productKnowledgeId) => ({
      queryKey: [
        "inventory",
        facilityId,
        locationId,
        productKnowledgeId,
        includeChildren,
      ],
      queryFn: async (context) => {
        const result = await query(inventoryApi.list, {
          pathParams: { facilityId, locationId },
          queryParams: {
            product_knowledge: productKnowledgeId,
            net_content_gt: 0,
            limit: 100,
            include_children: includeChildren,
          },
        })(context);
        // Attach productKnowledgeId to the result for proper mapping in combine
        return { ...result, _productKnowledgeId: productKnowledgeId };
      },
      enabled: !!facilityId && !!locationId && !!productKnowledgeId,
      staleTime: 30000, // 30 seconds
    })),
    combine: (results) => {
      const allLoading = results.some((r) => r.isLoading);
      const map: Record<string, InventoryRead[]> = {};

      results.forEach((result) => {
        const productKnowledgeId = result.data?._productKnowledgeId;
        if (productKnowledgeId && result.data?.results) {
          map[productKnowledgeId] = result.data.results;
        }
      });

      return {
        isLoading: allLoading,
        data: map,
      };
    },
  });

  // Update parent's inventory map when data changes
  useEffect(() => {
    if (Object.keys(inventoriesMap).length > 0) {
      onInventoriesFetched(inventoriesMap);
    }
  }, [inventoriesMap, onInventoriesFetched]);

  // Compute FEFO selections and insufficiency flags
  const { selections, insufficientProductKnowledgeIds } = useMemo(() => {
    // Only compute selections once on initial load
    if (hasComputedInitialSelection.current || isLoading) {
      return {
        selections: {} as Record<string, InventorySelection[]>,
        insufficientProductKnowledgeIds: new Set<string>(),
      };
    }

    const selectionsResult: Record<string, InventorySelection[]> = {};
    const insufficientIds = new Set<string>();

    for (const [productKnowledgeId, requiredQuantity] of Object.entries(
      requirements,
    )) {
      const inventories = inventoriesMap[productKnowledgeId] || [];

      // Filter valid lots and sort by expiration date (FEFO)
      const validInventories = inventories
        .filter((inv) => isLotAllowedForDispensing(inv.product.expiration_date))
        .sort((a, b) => {
          const dateA = a.product.expiration_date;
          const dateB = b.product.expiration_date;
          // Items without expiration date go last
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        });

      const batchSelections: InventorySelection[] = [];
      let remainingNeed = Math.floor(requiredQuantity);

      for (const inventory of validInventories) {
        if (remainingNeed <= 0) break;

        const availableQuantity = Math.floor(parseFloat(inventory.net_content));
        if (availableQuantity <= 0) continue;

        const allocateQuantity = Math.min(remainingNeed, availableQuantity);
        batchSelections.push({
          inventoryId: inventory.id,
          quantity: String(allocateQuantity),
          inventory,
        });

        remainingNeed -= allocateQuantity;
      }

      selectionsResult[productKnowledgeId] = batchSelections;

      // Flag as insufficient if we couldn't meet the required quantity
      if (remainingNeed > 0) {
        insufficientIds.add(productKnowledgeId);
      }
    }

    // Mark that we've computed initial selections
    if (Object.keys(inventoriesMap).length > 0) {
      hasComputedInitialSelection.current = true;
    }

    return {
      selections: selectionsResult,
      insufficientProductKnowledgeIds: insufficientIds,
    };
  }, [isLoading, requirements, inventoriesMap]);

  return {
    isLoading,
    selections,
    insufficientProductKnowledgeIds,
    inventoriesMap,
  };
}
