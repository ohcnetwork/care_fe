import {
  BillMedicationsFormValues,
  BillMedicationsMode,
} from "@/pages/Facility/services/pharmacy/billMedications/modes/types";
import useBillMedications from "@/pages/Facility/services/pharmacy/billMedications/utils/useBillMedications";
import { isMedicationDispenseable } from "@/pages/Facility/services/pharmacy/billMedications/utils/utils";
import { ACTIVE_MEDICATION_STATUSES } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { useQueries } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Options {
  facilityId: string;
  locationId: string;
  patientId: string;
  prescriptionIds: string[];
}

export default function usePrescriptionsMode({
  facilityId,
  locationId,
  patientId,
  prescriptionIds,
}: Options): BillMedicationsMode {
  const { t } = useTranslation();

  const { prescriptions, anyEncounter, isLoading } = useQueries({
    queries: prescriptionIds.map((prescriptionId) => ({
      queryKey: ["prescription", patientId, prescriptionId],
      queryFn: query(prescriptionApi.get, {
        pathParams: { patientId, id: prescriptionId },
      }),
    })),
    combine: (results) => ({
      isLoading: results.some((result) => result.isLoading),
      prescriptions: results.map((result) => result.data),
      anyEncounter: results.find((result) => !!result.data)?.data?.encounter,
    }),
  });

  const defaultValues = useMemo<BillMedicationsFormValues>(
    () => ({
      prescriptions: getPrescriptionFormValues(prescriptions),
      otherItems: [],
    }),
    [prescriptions],
  );

  const { mutate: billMedications, isPending: isSubmitting } =
    useBillMedications({
      facilityId,
      locationId,
      patientId,
      fallbackEncounterId: anyEncounter?.id ?? "",
      onSuccess: (dispenseOrder) => {
        toast.success(t("medications_billed_successfully"));
        navigate(
          `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrder.id}`,
          { replace: true },
        );
      },
    });

  const submit = (values: BillMedicationsFormValues) => {
    billMedications({
      items: [
        ...values.prescriptions.flatMap((prescription) => prescription.items),
        ...values.otherItems,
      ],
      prescriptionsToComplete: values.prescriptions
        .filter((p) => p.markComplete)
        .map(({ prescription }) => prescription.id),
    });
  };

  const onRemovePrescription = (prescriptionId: string) => {
    const newIds = prescriptionIds.filter((id) => id !== prescriptionId);
    if (newIds.length === 0) {
      navigate(
        `/facility/${facilityId}/locations/${locationId}/medication_requests`,
      );
    } else {
      navigate(newIds.join(","), { replace: true });
    }
  };

  return {
    encounter: anyEncounter,
    isLoading,
    defaultValues,
    submit,
    isSubmitting,
    pageOptions: {
      unbilledPrescriptionsFor: anyEncounter
        ? {
            patientId,
            facilityId,
            encounterId: anyEncounter.id,
            excludePrescriptionIds: prescriptionIds,
          }
        : undefined,
    },
    onRemovePrescription,
  };
}

const getPrescriptionFormValues = (
  prescriptions: (PrescriptionRead | undefined)[],
): BillMedicationsFormValues["prescriptions"] => {
  const result: BillMedicationsFormValues["prescriptions"] = [];

  for (const prescription of prescriptions) {
    if (!prescription) {
      continue;
    }

    const medications = prescription.medications.filter((medication) =>
      (ACTIVE_MEDICATION_STATUSES as readonly string[]).includes(
        medication.status,
      ),
    );

    if (medications.length === 0) {
      continue;
    }

    result.push({
      prescription,
      markComplete: true,
      items: medications.map((medication) => ({
        reference_id: crypto.randomUUID(),
        isSelected: isMedicationDispenseable(medication),
        medication: { ...medication, encounter: prescription.encounter.id },
        productKnowledge: medication.requested_product ?? null,
        substitution: null,
        dosageInstructions: medication.dosage_instruction,
        lots: [],
        allGiven: true,
      })),
    });
  }

  return result;
};
