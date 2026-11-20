import { navigate } from "raviger";
import { useEffect } from "react";

interface ClinicalHistoryProps {
  patientId: string;
  facilityId?: string;
}

export function ClinicalHistory({
  patientId,
  facilityId,
}: ClinicalHistoryProps) {
  useEffect(() => {
    const historyUrl = facilityId
      ? `/facility/${facilityId}/patient/${patientId}/history/responses`
      : `/patient/${patientId}/history/responses`;

    navigate(historyUrl);
  }, [patientId, facilityId]);

  return null;
}
