import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import Loading from "@/components/Common/Loading";
import { PrescriptionPreview } from "@/components/Prescription/PrescriptionPreview";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { t } from "i18next";

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
  const { data: dispenseOrder, isLoading: isLoadingDispenseOrder } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId! },
    }),
    enabled: !!dispenseOrderId && !!facilityId,
  });

  const resolvedPatientId = patientId ?? dispenseOrder?.patient?.id;

  const { data: encounterPrescriptions, isLoading: isLoadingEncounter } =
    useQuery({
      queryKey: [
        "prescriptions-list",
        resolvedPatientId,
        encounterId,
        facilityId,
      ],
      queryFn: query.paginated(prescriptionApi.list, {
        pathParams: { patientId: resolvedPatientId! },
        queryParams: { encounter: encounterId, facility: facilityId },
        pageSize: 100,
      }),
      enabled: !!encounterId && !!resolvedPatientId && !!facilityId,
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
  if (prescriptionId && !resolvedPatientId) {
    return <div>{t("patient_not_found")}</div>;
  }

  if (prescriptionId && resolvedPatientId) {
    return (
      <PrescriptionPreview
        prescriptionIds={[prescriptionId]}
        patientId={resolvedPatientId}
        facilityId={facilityId}
      />
    );
  }

  // Encounter
  if (encounterId && isLoadingEncounter) {
    return <Loading />;
  }

  if (encounterId && !resolvedPatientId) {
    return <div>{t("patient_not_found")}</div>;
  }

  if (encounterId && resolvedPatientId) {
    const encounterPrescriptionIds =
      encounterPrescriptions?.results?.map((p) => p.id) ?? [];

    if (encounterPrescriptionIds.length === 0) {
      return <div>{t("no_prescriptions_found")}</div>;
    }

    return (
      <PrescriptionPreview
        prescriptionIds={encounterPrescriptionIds}
        patientId={resolvedPatientId}
        facilityId={facilityId}
      />
    );
  }

  // Dispense order
  if (
    dispenseOrderId &&
    locationId &&
    (isLoadingDispenseOrder || isLoadingDispenses)
  ) {
    return <Loading />;
  }

  if (dispenseOrderId && locationId && !resolvedPatientId) {
    return <div>{t("patient_not_found")}</div>;
  }

  if (dispenseOrderId && locationId && resolvedPatientId) {
    if (dispensePrescriptionIds.length === 0) {
      return <div>{t("no_prescriptions_found")}</div>;
    }

    return (
      <PrescriptionPreview
        prescriptionIds={dispensePrescriptionIds}
        patientId={resolvedPatientId}
        facilityId={facilityId}
        locationName={dispenseOrder?.location?.name}
      />
    );
  }

  return <div>{t("prescription_not_found")}</div>;
};
