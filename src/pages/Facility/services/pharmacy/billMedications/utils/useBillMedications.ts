import { BillMedicationLineItemSchemaType } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import batchApi from "@/types/base/batch/batchApi";
import useDefaultBillingAccount from "@/types/billing/account/hooks/useDefaultBillingAccount";
import {
  ChargeItemBatchResponse,
  extractChargeItemsFromBatchResponse,
} from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import {
  DispenseOrderBatchResponse,
  DispenseOrderRead,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import {
  MedicationDispenseCategory,
  MedicationDispenseCreate,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";
import mutate from "@/Utils/request/mutate";
import { HttpMethod } from "@/Utils/request/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Options {
  facilityId: string;
  locationId: string;
  patientId: string;
  fallbackEncounterId: string;
}

export default function useBillMedications({
  facilityId,
  locationId,
  patientId,
  fallbackEncounterId,
}: Options) {
  const queryClient = useQueryClient();

  const { data: account } = useDefaultBillingAccount({ patientId, facilityId });

  const createInvoiceMutation = useMutation({
    mutationFn: mutate(invoiceApi.createInvoice, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const dispenseMutation = useMutation({
    mutationFn: mutate(batchApi.batchRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["prescription", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["medication_requests", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["accounts", patientId],
      });
    },
    // onError: (error) => {
    //   try {
    //     const errorData = error.cause as {
    //       results?: {
    //         data?: { detail?: string; errors?: { msg: string }[] };
    //       }[];
    //     };

    //     const errorMessages = errorData?.results
    //       ?.flatMap(
    //         (result) =>
    //           result?.data?.errors?.map((err) => err.msg) ||
    //           (result?.data?.detail ? [result.data.detail] : []),
    //       )
    //       .filter(Boolean);

    //     if (errorMessages?.length) {
    //       errorMessages.forEach((msg) => toast.error(msg));
    //     } else {
    //       toast.error(t("error_dispensing_medications"));
    //     }
    //   } catch {
    //     toast.error(t("error_dispensing_medications"));
    //   }
    // },
  });

  const billMedicationsMutation = useMutation({
    mutationFn: async ({
      items,
      prescriptionsToComplete,
    }: {
      items: BillMedicationLineItemSchemaType[];
      prescriptionsToComplete?: string[];
    }) => {
      const requests = [
        ...getDispenseCreateRequests({
          items,
          locationId,
          fallbackEncounterId,
          alternateIdentifier: getDispenseCreateAlternateIdentifier(patientId),
        }),

        ...(prescriptionsToComplete
          ? getPrescriptionCompletionRequest(prescriptionsToComplete, patientId)
          : []),
      ];
      try {
        const response = await dispenseMutation.mutateAsync({ requests });

        const dispenseOrder = (response as DispenseOrderBatchResponse).results
          .map((item) => item.data?.order)
          .filter((item): item is DispenseOrderRead => !!item)[0];

        const chargeItems = extractChargeItemsFromBatchResponse(
          response as ChargeItemBatchResponse,
        );

        if (chargeItems.length > 0 && account) {
          // TODO: so what happens if patient doesn't have an account?
          await createInvoiceMutation.mutateAsync({
            status: InvoiceStatus.issued,
            account: account.id,
            charge_items: chargeItems.map((item) => item.id),
          });
        }

        return dispenseOrder;
      } catch {
        // TODO: handle error
      }
    },
  });

  return billMedicationsMutation;
}

const getDispenseCreateAlternateIdentifier = (patientId: string) => {
  return `${patientId}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
};

const getDispenseCreateRequests = ({
  items,
  alternateIdentifier,
  locationId,
  fallbackEncounterId,
}: {
  items: BillMedicationLineItemSchemaType[];
  alternateIdentifier: string;
  locationId: string;
  fallbackEncounterId: string;
}) => {
  const whenPrepared = new Date();

  const requests = [];

  for (const item of items) {
    if (!item.isSelected) {
      continue;
    }

    for (const lot of item.lots) {
      const body: MedicationDispenseCreate = {
        status: MedicationDispenseStatus.preparation,
        category: MedicationDispenseCategory.outpatient, // TODO:
        when_prepared: whenPrepared,
        dosage_instruction: [],
        encounter: (item.medication?.encounter ?? fallbackEncounterId)!,
        authorizing_request: item.medication?.id ?? null,
        item: lot.item.id,
        quantity: lot.quantity,
        fully_dispensed: item.allGiven,
        create_dispense_order: {
          alternate_identifier: alternateIdentifier,
        },
        location: locationId,
        substitution: item.substitution
          ? {
              was_substituted: true,
              substitution_type: item.substitution.type,
              reason: item.substitution.reason,
            }
          : undefined,
      };

      requests.push({
        url: "/api/v1/medication/dispense/",
        method: HttpMethod.POST,
        reference_id: `dispense_${item.reference_id}_lot_${lot.item.id}`,
        body,
      } as const);
    }
  }

  return requests;
};

const getPrescriptionCompletionRequest = (ids: string[], patientId: string) => {
  if (ids.length === 0) {
    return [];
  }

  return [
    {
      url: `/api/v1/patient/${patientId}/medication/prescription/upsert/`,
      method: HttpMethod.POST,
      reference_id: `prescription_completion_upsert`,
      body: {
        datapoints: ids.map((id) => ({
          id,
          status: PrescriptionStatus.completed,
        })),
      },
    } as const,
  ];
};
