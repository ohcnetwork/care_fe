import { computeMedicationDispenseQuantity } from "@/components/Medicine/utils";
import { selectEligibleInventoryItems } from "@/pages/Facility/services/pharmacy/billMedications/utils/itemsAutoSelect";
import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { decimal, isGreaterThan } from "@/Utils/decimal";
import { isLotAllowedForDispensing } from "@/Utils/inventory";
import mutate from "@/Utils/request/mutate";
import { PaginatedResponse } from "@/Utils/request/types";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

interface InventoryItemsAutoSelectOptions {
  facilityId: string;
  locationId: string;
  productKnowledge: ProductKnowledgeBase | null;
  dosageInstructions: MedicationRequestDosageInstruction[];
  onSelect: (lots: ReturnType<typeof selectEligibleInventoryItems>) => void;
  autoSelectOnMount?: boolean;
}

export const useInventoryItemsAutoSelect = ({
  facilityId,
  locationId,
  productKnowledge,
  dosageInstructions,
  onSelect,
  autoSelectOnMount = true,
}: InventoryItemsAutoSelectOptions) => {
  const quantity = computeMedicationDispenseQuantity(dosageInstructions);

  const canAutoSelectInventoryItems =
    !!productKnowledge && !!quantity && isGreaterThan(quantity, 0);

  const { mutate: autoSelect, isPending } = useMutation({
    mutationFn: mutate(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: {
        product_knowledge: productKnowledge?.id || "",
        status: "active",
        limit: 100,
        net_content_gt: 0,
      },
    }),
    onSuccess: (data: PaginatedResponse<InventoryRead>) => {
      if (!canAutoSelectInventoryItems) {
        return;
      }

      const autoSelectedLots = selectEligibleInventoryItems(data.results, {
        quantity: decimal(quantity),
        canSelect: isLotAllowedForDispensing,
      });

      onSelect(autoSelectedLots);
    },
  });

  // Auto-select on mount
  useEffect(() => {
    if (canAutoSelectInventoryItems && autoSelectOnMount) {
      autoSelect(undefined);
    }
  }, [
    canAutoSelectInventoryItems,
    autoSelect,
    productKnowledge?.id,
    autoSelectOnMount,
    quantity,
  ]);

  return {
    canAutoSelectInventoryItems,
    isAutoSelectingInventoryItems: isPending,
    autoSelectInventoryItems() {
      if (canAutoSelectInventoryItems) {
        autoSelect(undefined);
      }
    },
  };
};
