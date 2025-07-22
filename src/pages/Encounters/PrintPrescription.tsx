import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import { PrescriptionPreview } from "@/components/Prescription/PrescriptionPreview";

import query from "@/Utils/request/query";
import encounterApi from "@/types/emr/encounter/encounterApi";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import patientApi from "@/types/emr/patient/patientApi";

export const PrintPrescription = (props: {
  facilityId: string;
  encounterId: string;
  patientId: string;
}) => {
  const { facilityId, encounterId, patientId } = props;
  const { t } = useTranslation();

  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
  });

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId || "" },
    }),
    enabled: !!patientId,
  });

  const { data: activeMedications, isLoading: medicationLoading } = useQuery({
    queryKey: ["medication_requests_active", patientId],
    queryFn: query.paginated(medicationRequestApi.list, {
      pathParams: { patientId: patientId },
      queryParams: {
        encounter: encounterId,
        status: ["active", "on_hold", "draft", "unknown"].join(","),
        facility: facilityId,
      },
      pageSize: 100,
    }),
    enabled: !!patientId,
  });

  if (medicationLoading || patientLoading) return <Loading />;

  if (!encounter || !activeMedications?.results || !patient) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_medications_found_for_this_encounter")}
      </div>
    );
  }

  return (
    <PrescriptionPreview
      encounter={encounter}
      medications={activeMedications.results}
      patient={patient}
    />
  );
};
