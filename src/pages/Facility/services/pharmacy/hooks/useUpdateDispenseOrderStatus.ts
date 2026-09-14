import { useMutation, useQueryClient } from "@tanstack/react-query";

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

interface Options {
  facilityId: string;
  locationId: string;
  dispenseOrder: DispenseOrderRead;
  dispenses: MedicationDispenseRead[];
  onSuccess?: (newStatus: DispenseOrderStatus) => void;
}

export interface UpdateDispenseOrderStatusArgs {
  newStatus: DispenseOrderStatus;
}

interface BatchRequest {
  url: string;
  method: string;
  reference_id: string;
  body: unknown;
}

/**
 * Order statuses whose transition cascades to the associated dispenses.
 *
 * Final corrections (`abandoned` / `entered_in_error`) are intentionally
 * excluded — the backend handles cancelling their dispenses.
 */
const DISPENSE_STATUS_BY_ORDER_STATUS: Partial<
  Record<DispenseOrderStatus, MedicationDispenseStatus>
> = {
  [DispenseOrderStatus.draft]: MedicationDispenseStatus.on_hold,
  [DispenseOrderStatus.in_progress]: MedicationDispenseStatus.in_progress,
  [DispenseOrderStatus.completed]: MedicationDispenseStatus.completed,
};

function buildDispenseUpdate(
  { newStatus }: UpdateDispenseOrderStatusArgs,
  dispenses: MedicationDispenseRead[],
): BatchRequest | null {
  const targetStatus = DISPENSE_STATUS_BY_ORDER_STATUS[newStatus];

  // Final corrections (abandoned / entered_in_error) don't touch dispenses.
  if (!targetStatus) {
    return null;
  }

  // Skip dispenses already cancelled / in error / declined, and completed
  // dispenses which must not be moved backward.
  const inFlight = dispenses.filter(
    (dispense) =>
      !MEDICATION_DISPENSE_CANCELLED_STATUSES.includes(dispense.status) &&
      dispense.status !== MedicationDispenseStatus.completed,
  );

  if (inFlight.length === 0) {
    return null;
  }

  const datapoints: MedicationDispenseUpsert[] = inFlight.map((dispense) => ({
    id: dispense.id,
    status: targetStatus,
    category: MedicationCategory.outpatient,
    when_prepared: dispense.when_prepared,
    dosage_instruction: dispense.dosage_instruction,
  }));

  return {
    url: `/api/v1/medication/dispense/upsert/`,
    method: HttpMethod.POST,
    reference_id: `update_medication_dispenses`,
    body: { datapoints },
  };
}

export default function useUpdateDispenseOrderStatus({
  facilityId,
  locationId,
  dispenseOrder,
  dispenses,
  onSuccess,
}: Options) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: UpdateDispenseOrderStatusArgs) => {
      const requests: BatchRequest[] = [
        {
          url: `/api/v1/facility/${facilityId}/order/dispense/${dispenseOrder.id}/`,
          method: HttpMethod.PATCH,
          reference_id: `update_dispense_order_${dispenseOrder.id}`,
          body: { status: args.newStatus },
        },
      ];

      const dispenseUpdate = buildDispenseUpdate(args, dispenses);
      if (dispenseUpdate) {
        requests.push(dispenseUpdate);
      }

      return mutate(batchApi.batchRequest)({ requests });
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({
        queryKey: ["dispenseOrder", facilityId, dispenseOrder.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["medication_dispense", dispenseOrder.id, locationId],
      });
      onSuccess?.(newStatus);
    },
  });
}
