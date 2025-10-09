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
      ? `/facility/${facilityId}/patient/${patientId}/history/symptoms`
      : `/patient/${patientId}/history/symptoms`;

    navigate(historyUrl);
  }, [patientId, facilityId]);

  return null;
}
