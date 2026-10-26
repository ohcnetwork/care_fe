import { useState } from "react";

import { ClinicalHistoryWorkspace } from "@/components/Workspace/ClinicalHistoryWorkspace";

/**
 * Tab 2 of the fill page: the patient's clinical history, embedded. Same
 * tab map as the standalone ClinicalHistoryPage (one shared source),
 * driven by local state instead of the URL so switching sections never
 * navigates away from the half-filled questionnaire.
 */
export function ClinicalHistoryTab({
  patientId,
  facilityId,
}: {
  patientId: string;
  facilityId?: string;
}) {
  const [tab, setTab] = useState("responses");

  return (
    <ClinicalHistoryWorkspace
      patientId={patientId}
      facilityId={facilityId}
      currentTab={tab}
      onTabChange={setTab}
      embedded
    />
  );
}
