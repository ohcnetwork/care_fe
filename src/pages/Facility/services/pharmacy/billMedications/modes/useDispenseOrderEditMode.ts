import {
  BillMedicationsFormValues,
  BillMedicationsMode,
} from "@/pages/Facility/services/pharmacy/billMedications/modes/types";
import useBillMedications from "@/pages/Facility/services/pharmacy/billMedications/utils/useBillMedications";
import { groupDispensesByPrescription } from "@/pages/Facility/services/pharmacy/utils/groupDispenses";
import { ChargeItemStatus } from "@/types/billing/chargeItem/chargeItem";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import encounterApi from "@/types/emr/encounter/encounterApi";
import {
  MedicationDispenseRead,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { ACTIVE_MEDICATION_STATUSES } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { isEqual, roundWhole } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { HttpMethod, PaginatedResponse } from "@/Utils/request/types";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Options {
  facilityId: string;
  locationId: string;
  patientId: string;
  dispenseOrderId: string;
}

const EMPTY_DEFAULT_VALUES: BillMedicationsFormValues = {
  prescriptions: [],
  otherItems: [],
};

export default function useDispenseOrderEditMode({
  facilityId,
  locationId,
  patientId,
  dispenseOrderId,
}: Options): BillMedicationsMode {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { isLoading: isLoadingOrder } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId },
    }),
  });

  const { data: allDispenses = [], isLoading: isLoadingDispenses } = useQuery({
    queryKey: ["medication_dispense", dispenseOrderId, locationId],
    queryFn: query.paginated(medicationDispenseApi.list, {
      queryParams: {
        location: locationId,
        order: dispenseOrderId,
      },
    }),
    select: (d: PaginatedResponse<MedicationDispenseRead>) => d.results,
  });

  const billableDispenses = useMemo(
    () =>
      allDispenses.filter(
        (d) => d.charge_item.status === ChargeItemStatus.billable,
      ),
    [allDispenses],
  );

  const { prescriptionGroups, otherDispenses } = useMemo(
    () => groupDispensesByPrescription(billableDispenses),
    [billableDispenses],
  );

  // Fetch the full PrescriptionRead for each prescription group.
  const prescriptionIds = useMemo(
    () => prescriptionGroups.map((g) => g.prescription.id),
    [prescriptionGroups],
  );

  const prescriptionQueries = useQueries({
    queries: prescriptionIds.map((id) => ({
      queryKey: ["prescription", patientId, id],
      queryFn: query(prescriptionApi.get, {
        pathParams: { patientId, id },
      }),
    })),
  });

  const isLoadingPrescriptions = prescriptionQueries.some((q) => q.isLoading);
  const prescriptionsById = useMemo(() => {
    const map = new Map<string, PrescriptionRead>();
    prescriptionQueries.forEach((q) => {
      if (q.data) {
        map.set(q.data.id, q.data);
      }
    });
    return map;
  }, [prescriptionQueries]);

  // For orphan dispenses without an authorizing_request (and thus without a
  // known encounter), fetch the retrieve shape to recover their encounter id.
  const otherItemIds = useMemo(
    () => otherDispenses.filter((d) => !d.authorizing_request).map((d) => d.id),
    [otherDispenses],
  );

  const otherItemQueries = useQueries({
    queries: otherItemIds.map((id) => ({
      queryKey: ["medication_dispense_retrieve", id],
      queryFn: query(medicationDispenseApi.get, { pathParams: { id } }),
    })),
  });

  const isLoadingRetrieves = otherItemQueries.some((q) => q.isLoading);
  const encounterByDispenseId = useMemo(() => {
    const map = new Map<string, string>();
    otherItemQueries.forEach((q) => {
      if (q.data) {
        map.set(q.data.id, q.data.encounter.id);
      }
    });
    return map;
  }, [otherItemQueries]);

  // Pick an encounter id for the patient header. Any active dispense's
  // encounter is fine — the header only uses the patient relationship.
  const headerEncounterId = useMemo(() => {
    const fromRequest = billableDispenses.find(
      (d) => d.authorizing_request?.encounter,
    )?.authorizing_request?.encounter;

    if (fromRequest) {
      return fromRequest;
    }

    return Array.from(encounterByDispenseId.values())[0];
  }, [billableDispenses, encounterByDispenseId]);

  const { data: headerEncounter, isLoading: isLoadingHeader } = useQuery({
    queryKey: ["encounter", headerEncounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: headerEncounterId! },
    }),
    enabled: !!headerEncounterId,
  });

  // Snapshot of original dispense state for the submit-time diff.
  const snapshot = useMemo(() => {
    const map = new Map<string, MedicationDispenseRead>();
    billableDispenses.forEach((d) => map.set(d.id, d));
    return map;
  }, [billableDispenses]);

  const defaultValues = useMemo<BillMedicationsFormValues>(() => {
    if (isLoadingDispenses || isLoadingPrescriptions || isLoadingRetrieves) {
      return EMPTY_DEFAULT_VALUES;
    }

    const prescriptionsList: BillMedicationsFormValues["prescriptions"] = [];

    for (const group of prescriptionGroups) {
      const fullPrescription = prescriptionsById.get(group.prescription.id);
      if (!fullPrescription) continue;

      const dispensesByMedReqId = new Map<string, MedicationDispenseRead[]>();
      for (const d of group.dispenses) {
        const reqId = d.authorizing_request?.id;
        if (!reqId) continue;
        const list = dispensesByMedReqId.get(reqId) ?? [];
        list.push(d);
        dispensesByMedReqId.set(reqId, list);
      }

      const items: BillMedicationsFormValues["prescriptions"][number]["items"] =
        [];
      for (const medication of fullPrescription.medications) {
        const dispensesForMed = dispensesByMedReqId.get(medication.id) ?? [];
        const isSelected = dispensesForMed.length > 0;
        // Skip inactive medications with no dispense to avoid clutter.
        if (
          !isSelected &&
          !(ACTIVE_MEDICATION_STATUSES as readonly string[]).includes(
            medication.status,
          )
        ) {
          continue;
        }

        const first = dispensesForMed[0];

        items.push({
          reference_id: crypto.randomUUID(),
          isSelected,
          medication,
          productKnowledge: medication.requested_product ?? null,
          substitution: first?.substitution?.substitution_type
            ? {
                substitutedProductKnowledge:
                  first.item.product.product_knowledge,
                type: first.substitution.substitution_type,
                reason: first.substitution.reason,
              }
            : null,
          dosageInstructions: first.dosage_instruction,
          lots: dispensesForMed.map((d) => ({
            item: d.item,
            quantity: roundWhole(d.quantity).toString(),
            existingDispenseId: d.id,
            existingDispenseQuantity: roundWhole(d.quantity).toString(),
            autoSelected: false,
          })),
          allGiven: true,
        });
      }

      if (items.length === 0) continue;

      prescriptionsList.push({
        prescription: fullPrescription,
        markComplete: false,
        items,
      });
    }

    // Group orphan dispenses by (authorizing_request.id, product_knowledge.id,
    // encounter.id) so each line item carries lots from a single context.
    const otherItemsMap = new Map<string, MedicationDispenseRead[]>();
    for (const d of otherDispenses) {
      const pkId = d.item.product.product_knowledge.id;
      const encId =
        d.authorizing_request?.encounter ??
        encounterByDispenseId.get(d.id) ??
        "";
      const reqId = d.authorizing_request?.id ?? "";
      const key = `${reqId}::${pkId}::${encId}`;
      const list = otherItemsMap.get(key) ?? [];
      list.push(d);
      otherItemsMap.set(key, list);
    }

    const otherItems: BillMedicationsFormValues["otherItems"] = [];
    for (const [, dispenses] of otherItemsMap) {
      const first = dispenses[0];
      otherItems.push({
        reference_id: crypto.randomUUID(),
        isSelected: true,
        medication: first.authorizing_request ?? null,
        productKnowledge: first.item.product.product_knowledge,
        substitution: first.substitution
          ? {
              substitutedProductKnowledge: first.item.product.product_knowledge,
              type: first.substitution.substitution_type,
              reason: first.substitution.reason,
            }
          : null,
        dosageInstructions: first.dosage_instruction,
        encounterOverride: first.authorizing_request
          ? undefined
          : encounterByDispenseId.get(first.id),
        lots: dispenses.map((d) => ({
          item: d.item,
          quantity: roundWhole(d.quantity).toString(),
          existingDispenseId: d.id,
          existingDispenseQuantity: roundWhole(d.quantity).toString(),
        })),
        allGiven: true,
      });
    }

    return { prescriptions: prescriptionsList, otherItems };
  }, [
    isLoadingDispenses,
    isLoadingPrescriptions,
    isLoadingRetrieves,
    prescriptionGroups,
    prescriptionsById,
    otherDispenses,
    encounterByDispenseId,
  ]);

  const navigateToDispenseOrderView = () => {
    navigate(
      `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}`,
      { replace: true },
    );
  };

  const { mutate: billMedications, isPending: isSubmitting } =
    useBillMedications({
      facilityId,
      locationId,
      patientId,
      fallbackEncounterId: headerEncounterId ?? "",
      dispenseOrderId,
      onSuccess: () => {
        toast.success(t("dispense_order_updated_successfully"));
        queryClient.invalidateQueries({
          queryKey: ["medication_dispense", dispenseOrderId],
        });
        navigateToDispenseOrderView();
      },
    });

  const submit = (values: BillMedicationsFormValues) => {
    const allItems = [
      ...values.prescriptions.flatMap((p) => p.items),
      ...values.otherItems,
    ];

    // Index current lots by their original dispense id.
    const currentExistingLots = new Map<
      string,
      { quantity: string; inventoryItemId: string }
    >();
    for (const item of allItems) {
      if (!item.isSelected) {
        continue;
      }

      for (const lot of item.lots) {
        if (lot.existingDispenseId) {
          currentExistingLots.set(lot.existingDispenseId, {
            quantity: lot.quantity,
            inventoryItemId: lot.item.id,
          });
        }
      }
    }

    const priorRequests: Array<{
      url: string;
      method: HttpMethod;
      reference_id: string;
      body: unknown;
    }> = [];
    const unchangedDispenseIds = new Set<string>();

    for (const [id, original] of snapshot) {
      const current = currentExistingLots.get(id);
      const cancelRequest = {
        url: `/api/v1/medication/dispense/${id}/`,
        method: HttpMethod.PUT,
        reference_id: `cancel_${id}`,
        body: { status: MedicationDispenseStatus.cancelled },
      };

      if (!current) {
        priorRequests.push(cancelRequest);
        continue;
      }

      const unchanged =
        isEqual(current.quantity, original.quantity) &&
        current.inventoryItemId === original.item.id;

      if (unchanged) {
        unchangedDispenseIds.add(id);
      } else {
        priorRequests.push(cancelRequest);
      }
    }

    // Strip unchanged lots so they are not recreated; keep modified/new lots.
    const stripUnchanged = (items: BillMedicationsFormValues["otherItems"]) =>
      items.map((item) => ({
        ...item,
        lots: item.lots.filter(
          (l) =>
            !l.existingDispenseId ||
            !unchangedDispenseIds.has(l.existingDispenseId),
        ),
      }));

    const items = [
      ...values.prescriptions.flatMap((p) => stripUnchanged(p.items)),
      ...stripUnchanged(values.otherItems),
    ].filter((item) => item.isSelected && item.lots.length > 0);

    if (items.length === 0 && priorRequests.length === 0) {
      navigateToDispenseOrderView();
      return;
    }

    billMedications({ items, priorRequests });
  };

  return {
    encounter: headerEncounter,
    isLoading:
      isLoadingOrder ||
      isLoadingDispenses ||
      isLoadingPrescriptions ||
      isLoadingRetrieves ||
      isLoadingHeader,
    defaultValues,
    submit,
    isSubmitting,
    pageOptions: {},
  };
}
