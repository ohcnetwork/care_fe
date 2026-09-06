import {
  DefaultError,
  MutateOptions,
  useQueryClient,
} from "@tanstack/react-query";

import { BatchRequestResponse } from "@/types/base/batch/batch";
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

type StatusMutationOptions = MutateOptions<
  BatchRequestResponse,
  DefaultError,
  UpdateDispenseOrderStatusArgs
>;

function statusArgs(
  requests: BatchRequestObject[],
): UpdateDispenseOrderStatusArgs {
  return {
    newStatus: (requests[0].body as { status: DispenseOrderStatus }).status,
  };
}

function adaptMutationOptions(
  args: UpdateDispenseOrderStatusArgs,
  options?: StatusMutationOptions,
):
  | MutateOptions<BatchRequestResponse, DefaultError, BatchRequestObject[]>
  | undefined {
  if (!options) return undefined;
  return {
    onSuccess: (data, _requests, ...context) =>
      options.onSuccess?.(data, args, ...context),
    onError: (error, _requests, ...context) =>
      options.onError?.(error, args, ...context),
    onSettled: (data, error, _requests, ...context) =>
      options.onSettled?.(data, error, args, ...context),
  };
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
): BatchRequestObject | null {
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

  const mutation = useBatchRequest({
    onSuccess: (_, requests) => {
      queryClient.invalidateQueries({
        queryKey: ["dispenseOrder", facilityId, dispenseOrder.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["medication_dispense", dispenseOrder.id, locationId],
      });
      onSuccess?.(statusArgs(requests).newStatus);
    },
  });

  const buildRequests = (args: UpdateDispenseOrderStatusArgs) => {
    const requests: BatchRequestObject[] = [
      {
        api: { ...dispenseOrderApi.update, method: HttpMethod.PATCH },
        pathParams: { facilityId, id: dispenseOrder.id },
        referenceId: `update_dispense_order_${dispenseOrder.id}`,
        body: { status: args.newStatus },
      },
    ];

    const dispenseUpdate = buildDispenseUpdate(args, dispenses);
    if (dispenseUpdate) requests.push(dispenseUpdate);
    return requests;
  };

  return {
    ...mutation,
    variables: mutation.variables ? statusArgs(mutation.variables) : undefined,
    mutate: (
      args: UpdateDispenseOrderStatusArgs,
      options?: StatusMutationOptions,
    ) =>
      mutation.mutate(buildRequests(args), adaptMutationOptions(args, options)),
    mutateAsync: (
      args: UpdateDispenseOrderStatusArgs,
      options?: StatusMutationOptions,
    ) =>
      mutation.mutateAsync(
        buildRequests(args),
        adaptMutationOptions(args, options),
      ),
  };
}
