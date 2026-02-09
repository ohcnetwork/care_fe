import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import Loading from "@/components/Common/Loading";
import { PrescriptionPreview } from "@/components/Prescription/PrescriptionPreview";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { useTranslation } from "react-i18next";

interface PrintPrescriptionProps {
  facilityId: string;
  patientId?: string;
  encounterId?: string;
  prescriptionId?: string;
  dispenseOrderId?: string;
  locationId?: string;
}

export const PrintPrescription = ({
  facilityId,
  patientId,
  encounterId,
  prescriptionId,
  dispenseOrderId,
  locationId,
}: PrintPrescriptionProps) => {
  const { t } = useTranslation();

  const { data: encounterPrescriptions, isLoading: isLoadingEncounter } =
    useQuery({
      queryKey: ["prescriptions-list", patientId, encounterId, facilityId],
      queryFn: query.paginated(prescriptionApi.list, {
        pathParams: { patientId: patientId! },
        queryParams: { encounter: encounterId, facility: facilityId },
        pageSize: 100,
      }),
      enabled: !!encounterId && !!patientId && !!facilityId,
    });

  const { data: medicationDispenses, isLoading: isLoadingDispenses } = useQuery<
    PaginatedResponse<MedicationDispenseRead>
  >({
    queryKey: ["medicationDispenses", dispenseOrderId, locationId],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        order: dispenseOrderId,
        location: locationId,
      },
    }),
    enabled: !!dispenseOrderId && !!locationId,
  });

  const dispenseOrder = medicationDispenses?.results?.[0]?.order;

  const dispensePrescriptionIds = useMemo(() => {
    const ids = new Set<string>();
    medicationDispenses?.results?.forEach((dispense) => {
      const prescriptionId = dispense.authorizing_request?.prescription?.id;
      if (prescriptionId) {
        ids.add(prescriptionId);
      }
    });
    return Array.from(ids);
  }, [medicationDispenses]);

  // Single prescription
  if (prescriptionId && !patientId) {
    return <div>{t("patient_not_found")}</div>;
  }

  if (prescriptionId && patientId) {
    return (
      <PrescriptionPreview
        prescriptionIds={[prescriptionId]}
        patientId={patientId}
        facilityId={facilityId}
      />
    );
  }

  // Encounter
  if (encounterId && isLoadingEncounter) {
    return <Loading />;
  }

  if (encounterId && !patientId) {
    return <div>{t("patient_not_found")}</div>;
  }

  if (encounterId && patientId) {
    const encounterPrescriptionIds =
      encounterPrescriptions?.results?.map((p) => p.id) ?? [];

    if (encounterPrescriptionIds.length === 0) {
      return <div>{t("no_prescriptions_found")}</div>;
    }

    return (
      <PrescriptionPreview
        prescriptionIds={encounterPrescriptionIds}
        patientId={patientId}
        facilityId={facilityId}
      />
    );
  }

  // Dispense order
  if (dispenseOrderId && locationId && isLoadingDispenses) {
    return <Loading />;
  }

  if (dispenseOrderId && locationId && !dispenseOrder?.patient?.id) {
    return <div>{t("patient_not_found")}</div>;
  }

  if (dispenseOrderId && locationId && dispenseOrder?.patient?.id) {
    if (dispensePrescriptionIds.length === 0) {
      return <div>{t("no_prescriptions_found")}</div>;
    }

    return (
      <PrescriptionPreview
        prescriptionIds={dispensePrescriptionIds}
        patientId={dispenseOrder.patient.id}
        facilityId={facilityId}
        locationName={dispenseOrder.location.name}
      />
    );
  }

  return <div>{t("prescription_not_found")}</div>;
};
