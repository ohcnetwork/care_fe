import batchApi from "@/types/base/batch/batchApi";
import {
  DispenseOrderRead,
  DispenseOrderStatus,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import {
  MEDICATION_DISPENSE_CANCELLED_STATUSES,
  MedicationDispenseRead,
  MedicationDispenseStatus,
  MedicationDispenseUpsert,
} from "@/types/emr/medicationDispense/medicationDispense";
import { MedicationCategory } from "@/types/emr/medicationRequest/medicationRequest";
import mutate from "@/Utils/request/mutate";
import { HttpMethod } from "@/Utils/request/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Options {
  facilityId: string;
  locationId: string;
  dispenseOrder: DispenseOrderRead;
  dispenses: MedicationDispenseRead[];
  onSuccess?: (newStatus: DispenseOrderStatus) => void;
}

export interface UpdateDispenseOrderStatusArgs {
  newStatus: DispenseOrderStatus;
  /**
   * When `true`, in-flight dispenses (preparation/in_progress) transitioning
   * because the order moves to `draft` will be set to `on_hold` instead of
   * `preparation`.
   */
  hold?: boolean;
}

const STATUS_TO_DISPENSE_STATUS: Record<
  DispenseOrderStatus,
  MedicationDispenseStatus
> = {
  [DispenseOrderStatus.draft]: MedicationDispenseStatus.preparation,
  [DispenseOrderStatus.in_progress]: MedicationDispenseStatus.in_progress,
  [DispenseOrderStatus.completed]: MedicationDispenseStatus.completed,
  [DispenseOrderStatus.abandoned]: MedicationDispenseStatus.cancelled,
  [DispenseOrderStatus.entered_in_error]:
    MedicationDispenseStatus.entered_in_error,
};

export default function useUpdateDispenseOrderStatus({
  facilityId,
  locationId,
  dispenseOrder,
  dispenses,
  onSuccess,
}: Options) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ newStatus, hold }: UpdateDispenseOrderStatusArgs) => {
      const requests: Array<{
        url: string;
        method: string;
        reference_id: string;
        body: unknown;
      }> = [
        {
          url: `/api/v1/facility/${facilityId}/order/dispense/${dispenseOrder.id}/`,
          method: HttpMethod.PATCH,
          reference_id: `update_dispense_order_${dispenseOrder.id}`,
          body: { status: newStatus },
        },
      ];

      // Final corrections (abandoned / entered_in_error) cascade to each
      // associated dispense only when the order isn't already completed.
      // If the order is completed, backend handles the cancellation of
      // already-completed dispenses.
      const isFinalCorrection =
        newStatus === DispenseOrderStatus.abandoned ||
        newStatus === DispenseOrderStatus.entered_in_error;

      const orderAlreadyCompleted =
        dispenseOrder.status === DispenseOrderStatus.completed;

      const inFlight = dispenses.filter((dispense) => {
        // For final corrections on already-completed orders, backend will
        // handle cancelling the associated dispenses — skip client-side.
        if (isFinalCorrection && orderAlreadyCompleted) {
          return false;
        }

        // Don't move dispenses that are already cancelled / in error / declined.
        if (MEDICATION_DISPENSE_CANCELLED_STATUSES.includes(dispense.status)) {
          return false;
        }

        // Don't move completed dispenses backward unless applying a final correction.
        if (
          dispense.status === MedicationDispenseStatus.completed &&
          !isFinalCorrection
        ) {
          return false;
        }
        return true;
      });

      if (inFlight.length > 0) {
        const newDispenseStatus =
          hold && newStatus === DispenseOrderStatus.draft
            ? MedicationDispenseStatus.on_hold
            : STATUS_TO_DISPENSE_STATUS[newStatus];

        const updates: MedicationDispenseUpsert[] = inFlight.map((d) => ({
          id: d.id,
          status: newDispenseStatus,
          category: MedicationCategory.outpatient,
          when_prepared: d.when_prepared,
          dosage_instruction: d.dosage_instruction,
        }));

        requests.push({
          url: `/api/v1/medication/dispense/upsert/`,
          method: HttpMethod.POST,
          reference_id: `update_medication_dispenses`,
          body: { datapoints: updates },
        });
      }

      return mutate(batchApi.batchRequest)({ requests });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dispenseOrder", facilityId, dispenseOrder.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["medication_dispense", dispenseOrder.id, locationId],
      });
      toast.success(t("medication_dispense_updated"));
      onSuccess?.(variables.newStatus);
    },
  });

  return mutation;
}
