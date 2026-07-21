import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AddMedicationRow,
  AddMedicationValue,
} from "@/pages/Facility/services/pharmacy/components/AddMedicationSheet";
import { useAttachChargeItemsToInvoice } from "@/pages/Facility/services/pharmacy/hooks/useAttachChargeItemsToInvoice";

import {
  ChargeItemBatchResponse,
  extractChargeItemsFromBatchResponse,
} from "@/types/billing/chargeItem/chargeItem";
import {
  MedicationDispenseCreate,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { MedicationCategory } from "@/types/emr/medicationRequest/medicationRequest";

import { useBatchRequest } from "@/Utils/request/batch";

interface Props {
  facilityId: string;
  locationId: string;
  dispenseOrderId: string;
  /**
   * Encounter to attach the created dispenses to. Added medications have no
   * authorizing request, so the encounter must be supplied by the caller
   * (derived from the order's existing dispenses).
   */
  encounterId?: string;
  /**
   * Account used to create a new draft invoice when no draft invoice exists.
   */
  accountId?: string;
  /**
   * When set, charge items of the created dispenses are appended to this
   * draft invoice. When unset, a new draft invoice is created for the account.
   */
  draftInvoiceId?: string;
}

/**
 * Dispense-order-specific wrapper around {@link AddMedicationRow}. Each
 * selected lot creates one dispense attached to the same dispense order, and
 * the resulting charge items are appended to the given draft invoice (or a
 * newly created draft invoice when none exists).
 */
export function AddDispenseMedicationRow({
  facilityId,
  locationId,
  dispenseOrderId,
  encounterId,
  accountId,
  draftInvoiceId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const attachChargeItemsToInvoice = useAttachChargeItemsToInvoice({
    facilityId,
    accountId,
    draftInvoiceId,
  });

  const { mutateAsync: saveMedication, isPending: isSaving } = useBatchRequest({
    onSuccess: async (response) => {
      const chargeItems = extractChargeItemsFromBatchResponse(
        response as ChargeItemBatchResponse,
      );
      await attachChargeItemsToInvoice(chargeItems.map((item) => item.id));

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
    if (!encounterId) return;

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
    <AddMedicationRow
      facilityId={facilityId}
      locationId={locationId}
      onSave={handleSave}
      isSaving={isSaving}
      disableSave={!encounterId}
    />
  );
}
