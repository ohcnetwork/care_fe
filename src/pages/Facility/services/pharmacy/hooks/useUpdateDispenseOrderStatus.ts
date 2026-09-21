import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  DispenseOrderRead,
  DispenseOrderStatus,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import {
  MEDICATION_DISPENSE_CANCELLED_STATUSES,
  MedicationDispenseRead,
  MedicationDispenseStatus,
  MedicationDispenseUpsert,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { MedicationCategory } from "@/types/emr/medicationRequest/medicationRequest";
import { BatchRequestObject, useBatchRequest } from "@/Utils/request/batch";

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
): BatchRequestObject<{ datapoints: MedicationDispenseUpsert[] }> | null {
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
    api: medicationDispenseApi.upsert,
    referenceId: `update_medication_dispenses`,
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
  const { mutateAsync: executeBatch } = useBatchRequest({});

  return useMutation({
    mutationFn: (args: UpdateDispenseOrderStatusArgs) => {
      const requests: BatchRequestObject[] = [
        {
          api: dispenseOrderApi.update,
          pathParams: { facilityId, id: dispenseOrder.id },
          referenceId: `update_dispense_order_${dispenseOrder.id}`,
          body: { status: args.newStatus },
        },
      ];

      const dispenseUpdate = buildDispenseUpdate(args, dispenses);
      if (dispenseUpdate) {
        requests.push(dispenseUpdate);
      }

      return executeBatch(requests);
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
