import { useEffect } from "react";

import { navigate } from "@/lib/router/navigate";

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

    navigate({ href: historyUrl });
  }, [patientId, facilityId]);

  return null;
}
