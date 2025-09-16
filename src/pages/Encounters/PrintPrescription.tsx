import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import { PrescriptionPreview } from "@/components/Prescription/PrescriptionPreview";

import query from "@/Utils/request/query";
import encounterApi from "@/types/emr/encounter/encounterApi";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import patientApi from "@/types/emr/patient/patientApi";
import { groupMedicationsByPrescription } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";

export const PrintPrescription = (props: {
  facilityId: string;
  encounterId?: string;
  patientId: string;
  prescriptionId?: string;
}) => {
  const { facilityId, encounterId, patientId, prescriptionId } = props;
  const { t } = useTranslation();

  const { data: prescription, isLoading } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId, id: prescriptionId! },
    }),
    enabled: !!prescriptionId,
  });

  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId || prescription?.encounter?.id || "" },
      queryParams: { facility: facilityId },
    }),
    enabled: !!encounterId || !!prescription?.encounter?.id,
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
    enabled: !!patientId && !!encounterId && !!facilityId && !prescriptionId,
  });

  if (patientLoading || isLoading || medicationLoading) return <Loading />;

  if (
    (!encounter && !prescription) ||
    !patient ||
    (!prescriptionId && !activeMedications?.results?.length) ||
    (prescriptionId && !prescription)
  ) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_medications_found_for_this_encounter")}
      </div>
    );
  }

  const groupedByPrescription = groupMedicationsByPrescription(
    prescription
      ? prescription.medications || []
      : activeMedications?.results || [],
  );

  return (
    <PrescriptionPreview
      encounter={encounter}
      prescriptions={groupedByPrescription}
      patient={patient}
    />
  );
};
