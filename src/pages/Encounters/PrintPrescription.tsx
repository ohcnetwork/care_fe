import { useQuery } from "@tanstack/react-query";

import Loading from "@/components/Common/Loading";
import { PrescriptionPreview } from "@/components/Prescription/PrescriptionPreview";

import query from "@/Utils/request/query";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { useTranslation } from "react-i18next";

interface PrintPrescriptionProps {
  facilityId: string;
  patientId: string;
  encounterId?: string;
  prescriptionId?: string;
}

export const PrintPrescription = ({
  facilityId,
  patientId,
  encounterId,
  prescriptionId,
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

  if (!prescriptionId && !encounterId) {
    return <div>{t("encounter_not_found")}</div>;
  }

  if (encounterId && isLoadingEncounter) {
    return <Loading />;
  }

  const resolvedPrescriptionIds = prescriptionId
    ? [prescriptionId]
    : (encounterPrescriptions?.results?.map((p) => p.id) ?? []);

  if (resolvedPrescriptionIds.length === 0) {
    return <div>{t("no_prescriptions_found")}</div>;
  }

  return (
    <PrescriptionPreview
      prescriptionIds={resolvedPrescriptionIds}
      patientId={patientId}
      facilityId={facilityId}
    />
  );
};
