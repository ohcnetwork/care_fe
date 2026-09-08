import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AddMedicationSheet,
  AddMedicationValue,
} from "@/pages/Facility/services/pharmacy/components/AddMedicationSheet";

import {
  ChargeItemBatchResponse,
  extractChargeItemsFromBatchResponse,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import {
  MedicationDispenseCreate,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { MedicationCategory } from "@/types/emr/medicationRequest/medicationRequest";

import { useBatchRequest } from "@/Utils/request/batch";
import mutate from "@/Utils/request/mutate";

interface Props {
  facilityId: string;
  locationId: string;
  dispenseOrderId: string;
  /**
   * Encounter to attach the created dispenses to. Added medications have no
   * authorizing request, so the encounter must be supplied by the caller
   * (derived from the order's existing dispenses).
   */
  encounterId: string;
  /**
   * When set, charge items of the created dispenses are appended to this
   * draft invoice. When unset, they stay unbilled.
   */
  draftInvoiceId?: string;
}

/**
 * Dispense-order-specific wrapper around {@link AddMedicationRow}. Each
 * selected lot creates one dispense attached to the same dispense order, and
 * the resulting charge items are appended to the given draft invoice, if any.
 */
export function AddDispenseMedicationRow({
  facilityId,
  locationId,
  dispenseOrderId,
  encounterId,
  draftInvoiceId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutateAsync: attachChargeItemsToInvoice } = useMutation({
    mutationFn: mutate(chargeItemApi.addChargeItemsToInvoice, {
      pathParams: { facilityId, invoiceId: draftInvoiceId ?? "" },
    }),
  });

  const { mutateAsync: saveMedication, isPending: isSaving } = useBatchRequest({
    onSuccess: async (response) => {
      const chargeItems = extractChargeItemsFromBatchResponse(
        response as ChargeItemBatchResponse,
      );
      if (chargeItems.length && draftInvoiceId) {
        await attachChargeItemsToInvoice({
          charge_items: chargeItems.map((item) => item.id),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
      queryClient.invalidateQueries({ queryKey: ["dispenseOrder"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      toast.success(t("medication_added_successfully"));
    },
  });

  const handleSave = async ({
    dosageInstructions,
    note,
    lots,
  }: AddMedicationValue) => {
    const whenPrepared = new Date();

    await saveMedication(
      lots.map((lot) => ({
        api: medicationDispenseApi.create,
        referenceId: `add_medication_lot_${lot.item.id}`,
        body: {
          status: MedicationDispenseStatus.preparation,
          category: MedicationCategory.outpatient,
          when_prepared: whenPrepared,
          note: note || undefined,
          dosage_instruction: dosageInstructions,
          encounter: encounterId,
          location: locationId,
          authorizing_request: null,
          item: lot.item.id,
          quantity: lot.quantity,
          fully_dispensed: true,
          order: dispenseOrderId,
        } satisfies MedicationDispenseCreate,
      })),
    );
  };

  return (
    <AddMedicationSheet
      facilityId={facilityId}
      locationId={locationId}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
