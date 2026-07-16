import { BillMedicationLineItemSchemaType } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import batchApi from "@/types/base/batch/batchApi";
import usePatientDefaultBillingAccount from "@/types/billing/account/hooks/useDefaultBillingAccount";
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
  MedicationDispenseCreate,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import { MedicationCategory } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";
import mutate from "@/Utils/request/mutate";
import { HttpMethod } from "@/Utils/request/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: account, refetch: refetchAccount } =
    usePatientDefaultBillingAccount({
      patientId,
      facilityId,
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
      queryClient.invalidateQueries({ queryKey: ["dispenseOrder"] });
      queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: mutate(invoiceApi.createInvoice, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
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

      const response = await dispenseMutation.mutateAsync({ requests });

      const dispenseOrder = (response as DispenseOrderBatchResponse).results
        .map((item) => item.data?.order)
        .filter((item): item is DispenseOrderRead => !!item)[0];

      const chargeItems = extractChargeItemsFromBatchResponse(
        response as ChargeItemBatchResponse,
      );

      // Get the account ID from the account or refetch it if it's not available.
      const accountId = account?.id ?? (await refetchAccount()).data?.id;

      if (chargeItems.length > 0 && accountId) {
        await createInvoiceMutation.mutateAsync({
          status: InvoiceStatus.draft,
          account: accountId,
          charge_items: chargeItems.map((item) => item.id),
        });
      }

      return dispenseOrder;
    },
    onSuccess: (response: DispenseOrderRead) => {
      queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", patientId] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });

      toast.success(t("medications_billed_successfully"));
      navigate(
        `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${response.id}?autoAdvanceStatus=true`,
        { replace: true },
      );
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
        category: item.medication?.category ?? MedicationCategory.outpatient,
        when_prepared: whenPrepared,
        dosage_instruction: item.dosageInstructions ?? [],
        encounter: (item.medication?.encounter ?? fallbackEncounterId)!,
        authorizing_request: item.medication?.id ?? null,
        item: lot.item.id,
        quantity: lot.quantity,
        fully_dispensed: item.allGiven,
        location: locationId,
        substitution: item.substitution
          ? {
              was_substituted: true,
              substitution_type: item.substitution.type,
              reason: item.substitution.reason,
            }
          : undefined,
        create_dispense_order: {
          alternate_identifier: alternateIdentifier,
        },
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
