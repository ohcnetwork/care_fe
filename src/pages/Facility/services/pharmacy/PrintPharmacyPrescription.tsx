import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";

import { PrescriptionPreview } from "@/components/Prescription/PrescriptionPreview";

import query from "@/Utils/request/query";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import patientApi from "@/types/emr/patient/patientApi";

interface Props {
  facilityId: string;
  patientId: string;
}

export function PrintPharmacyPrescription({ facilityId, patientId }: Props) {
  const [qParams] = useQueryParams();
  const { data: response } = useQuery({
    queryKey: ["medication_requests", patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        facility: facilityId,
        limit: 100,
        status: qParams.status || "active",
        priority: qParams.priority,
        dispense_status: qParams.dispense_status,
        dispense_status_isnull: qParams.dispense_status_isnull === "true",
      },
    }),
  });

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId || "" },
    }),
    enabled: !!patientId,
  });

  const medications = response?.results || [];
  const filteredMedications =
    qParams.type === "pharmacy"
      ? medications.filter((med) => med.requested_product)
      : medications.filter((med) => !med.requested_product);

  if (!patient || filteredMedications.length === 0) {
    return null;
  }

  return (
    <PrescriptionPreview medications={filteredMedications} patient={patient} />
  );
}
